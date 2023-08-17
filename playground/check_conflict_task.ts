import { BaseClient } from '@base-open/node-sdk';
// import dayjs from 'dayjs';
// import utc from 'dayjs/plugin/utc';
// import timezone from 'dayjs/plugin/timezone';
// dayjs.extend(utc)
// dayjs.extend(timezone)
// dayjs.tz.setDefault("Asia/Shanghai")

interface IRecord {
  record_id: string;
  fields: Record<string, any>
}


// const APP_TOKEN = process.env['APP_TOKEN']
// const PERSONAL_BASE_TOKEN = process.env['PERSONAL_BASE_TOKEN']
// const TABLEID = process.env['TABLE_ID']

//https://jiliguala.feishu.cn/base/bascn00boudohds3J3Rbix5h6Bd?table=tblgxvkbphNNrBEw&view=vew2hRFW2F#CategoryAutomatedUpdate&from=bitable_automation
const APP_TOKEN = process.env['PROD_APP_TOKEN']
const PERSONAL_BASE_TOKEN = process.env['PROD_PERSONAL_BASE_TOKEN']
const TABLEID = process.env['PROD_TABLE_ID']

const client = new BaseClient({
  appToken: APP_TOKEN,
  personalBaseToken: PERSONAL_BASE_TOKEN,
});

function isCollide(start1,end1,start2,end2): boolean {
  return (start1 >= start2 && start1 < end2) ||
    (end1 > start2 && end1 <= end2) ||
    (start1 <= start2 && end1 >= end2)
}

async function populateQuery(record_id) {
  let query = { page_size: 400 }
  
  if (record_id) {
    const triggerRecordRes = await client.base.appTableRecord.get({path: { table_id: TABLEID, record_id : record_id}})  
    const triggerRecord = triggerRecordRes?.data?.record || {}
    console.debug(triggerRecord)  
    const developer = triggerRecord.fields['开发'][0]['name'] || "" //无法通过 id 来查询
    if (developer) query.filter = 'CurrentValue.[开发]="' + developer + '"'
    // if (developer) query.filter = 'CurrentValue.[开发]="骆仕恺"'
    // const developer = modifiedRecord.fields['开发'][0]['id'] //无法通过 id 来查询
    // if (developer) query.filter = 'CurrentValue.[开发]="' + developer + '"'
    console.debug(query)  
  }
  return query
}

async function batchUpdateRecords(records) {
  await client.base.appTableRecord.batchUpdate({
    path: {
      table_id: TABLEID,
    },
    data: {
      records: records
    }
  })
}

// search_and_replace
export async function check_conflict_task(record_id:String) {
  const s = performance.now();
  console.log('>>> start check_conflict_task, record_id: ',record_id);

  let allRecords: IRecord[] = []
  let collideRecords : IRecord[] = []
  let userRecordsMap = {}
  // let userIds = []
  
  const query = await populateQuery(record_id)

  // iterate over all records
  for await (const data of await client.base.appTableRecord.listWithIterator({ params: query, path: { table_id: TABLEID } })) {
    const records = data?.items || [];
    // console.debug('record : ', JSON.stringify(records[0]))
    
    const validRecords = records.filter(record => {
      const fields = record.fields
      return fields['开始时间'] != null && fields['完成时间'] != null && fields['开发'] != null
    })

    console.info('>>> records length : ', records.length, 'valid records lenght : ',validRecords.length);
    allRecords.push(...validRecords) 

    for (let i = 0; i < validRecords.length; i++) {
      const record = validRecords[i]
      const userID = record.fields['开发'][0]['id']
      // console.log(userID)
      let userRecords = userRecordsMap[userID] || []
      userRecords.push(record)
      userRecordsMap[userID] = userRecords
    }
  }
  console.info('>>> allRecords length : ', allRecords.length);
  // console.debug('userRecordsMap : ',JSON.stringify(userRecordsMap))
  
  for (let i = 0; i < allRecords.length; i++) {
    // Get cell string from specified fieldId and recordId
    const currentRecord = allRecords[i]
    const record_id = currentRecord.record_id
    const currentStartTime = currentRecord.fields['开始时间']
    const currentEndTime = currentRecord.fields['完成时间']
    // const currentTaskName = currentRecord.fields['需求名']
    const currentTaskName = currentRecord.fields['任务标题'][0]['text']
    const currentUsers = currentRecord.fields['开发'] || []
    const currentUser = currentUsers[0]
    const currentUserID = currentUser['id']
    

    // console.info('开始检查任务i ' + (i+1) +'/' + allRecords.length)

    let collideInfos = []
    
    for (let j = 0; j < userRecordsMap[currentUserID].length; j++) {
      
      if (i == j) continue

      const record = allRecords[j]
      const startTime = record.fields['开始时间']
      const endTime = record.fields['完成时间']
      const taskName = record.fields['任务标题'][0]['text']
      const users = record.fields['开发'] || []
      const user = users[0]

      
      // console.log('current User :', JSON.stringify(currentUser), 'user : ', JSON.stringify(user))
      
      if (currentUser['id'] != user['id']) continue

      // console.log('检测任务', JSON.stringify(record))
      if (isCollide(currentStartTime, currentEndTime, startTime, endTime)) {
        console.log(currentTaskName + ' 和 ' + taskName + ' 有冲突')
        
        // const collideInfo = '!' + dayjs(startTime).tz('Asia/Shanghai').date() + "~" + dayjs(endTime).tz('Asia/Shanghai').date()+taskName
        // console.log('>>> 冲突任务：',taskName)
        collideInfos.push(taskName)
        
      }
    }
    
    if(collideInfos.length > 0){
      collideRecords.push({
        record_id,
        fields: {"冲突任务" : collideInfos.join('\n')}
      })  
    }
    
  }

  // console.debug('冲突任务： ', JSON.stringify(collideRecords))

  await batchUpdateRecords(collideRecords)

  const e = performance.now();
  const duration = Number.parseInt((e-s)/1000)
  
  const response = "检测到 " + collideRecords.length + "条冲突任务，更新完毕" + "耗时" + duration + "s"
  console.log(response)
  return response
}


console.log('start')