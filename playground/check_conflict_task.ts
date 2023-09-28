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

async function populateQuery(username) {
  let query = { 
    page_size: 500,
    field_names: '["开发","任务标题","开始时间","完成时间"]'
  }

  let filter = 'NOT(CurrentValue.[开发]="") && NOT(CurrentValue.[开始时间]="") && NOT(CurrentValue.[完成时间]="")'
  if (username) filter += '&& CurrentValue.[开发]="' + username + '"'//无法通过 id 来查询，如果有同名人员会扩大范围，但不影响比对（查询时只支持名字，比对时可以用 id）
  query.filter = filter
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

async function populateUserRecordsMap(username) {
  
  let userRecordsMap = new Map()
  // let userIds: Set<String> = new Set();
  
  // iterate over all records
  const query = await populateQuery(username)
  for await (const data of await client.base.appTableRecord.listWithIterator({ params: query, path: { table_id: TABLEID } })) {
    const records = data?.items || [];
    // console.debug('record : ', JSON.stringify(records[0]))
    
    // const validRecords = records.filter(record => {
    //   const fields = record.fields
    //   return fields['开始时间'] != null && fields['完成时间'] != null && fields['开发'] != null
    // })

    console.info('>>> records length : ', records.length);
    // allRecords.push(...validRecords) 

    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      const userID = record.fields['开发'][0]['id']
      // console.log(userID)
      let userRecords = userRecordsMap.get(userID) || []
      userRecords.push(record)

      userRecordsMap.set(userID,userRecords)
    }
  }
  return userRecordsMap
}

// search_and_replace
export async function check_conflict_task(username:String) {
  const s = performance.now();
  console.log('>>> start check_conflict_task, username: ',username);

  let collideRecords : IRecord[] = []
  
  const userRecordsMap = await populateUserRecordsMap(username)

  const userIDs = Array.from(userRecordsMap.keys())
  console.info('>>> userIds length : ', userIDs.length);
  // console.debug('userRecordsMap : ',JSON.stringify(userRecordsMap))
  // userRecordsMap.keys.forEach((userID:String) => {
  //   console.log(userID)
  // })
  userIDs.forEach((userID: String) => {
    const records = userRecordsMap.get(userID)

    for (let i = 0; i < records.length; i++) {
      // Get cell string from specified fieldId and recordId
      const currentRecord = records[i]
      const record_id = currentRecord.record_id
      const currentStartTime = currentRecord.fields['开始时间']
      const currentEndTime = currentRecord.fields['完成时间']
      // const currentTaskName = currentRecord.fields['需求名']
      const currentTaskName = currentRecord.fields['任务标题'][0]['text']
      
  
      // console.info('开始检查任务i ' + (i+1) +'/' + allRecords.length)
  
      let collideInfos = []
      
      for (let j = 0; j < records.length; j++) {
        
        if (i == j) continue
  
        const record = records[j]
        const startTime = record.fields['开始时间']
        const endTime = record.fields['完成时间']
        const taskName = record.fields['任务标题'][0]['text']
  
        // console.log('current User :', JSON.stringify(currentUser), 'user : ', JSON.stringify(user))
  
        // console.log('检测任务', JSON.stringify(record))
        if (isCollide(currentStartTime, currentEndTime, startTime, endTime)) {
          // console.log(currentTaskName + ' 和 ' + taskName + ' 有冲突')
          
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
  })
  
  // console.debug('冲突任务： ', JSON.stringify(collideRecords))

  await batchUpdateRecords(collideRecords)

  const e = performance.now();
  const duration = Number.parseInt((e-s)/1000)
  
  const response = "检测到 " + collideRecords.length + "条冲突任务，更新完毕" + "耗时" + duration + "s"
  console.log(response)
  return response
}


console.log('start')