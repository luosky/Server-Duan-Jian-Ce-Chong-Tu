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


function isCollide(start1,end1,start2,end2): boolean {
  return (start1 >= start2 && start1 < end2) ||
    (end1 > start2 && end1 <= end2) ||
    (start1 <= start2 && end1 >= end2)
}

// search_and_replace
export async function check_conflict_task() {
  const s = performance.now();
  console.log('>>> starting');

  const client = new BaseClient({
    appToken: APP_TOKEN,
    personalBaseToken: PERSONAL_BASE_TOKEN,
  });
  
  
  let allRecords: IRecord[] = []
  let collideRecords : IRecord[] = []

  // iterate over all records
  for await (const data of await client.base.appTableRecord.listWithIterator({ params: { page_size: 400 }, path: { table_id: TABLEID } })) {
    const records = data?.items || [];
    console.debug('record : ', JSON.stringify(records[0]))
    
    const validRecords = records.filter(record => {
      const fields = record.fields
      return fields['开始时间'] != null && fields['完成时间'] != null && fields['开发'] != null
      // return fields['开始时间'] != null && fields['完成时间'] != null && fields['开发'] != null && (fields['需求阶段'] == '估时排期' || fields['需求阶段'] == '开发测试' )
    })
    console.log('>>> records length : ', records.length, 'valid records lenght : ',validRecords.length);
    allRecords.push(...validRecords) 
  }
    console.log('>>> allRecords length : ', allRecords.length);

  
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
      

      console.log('开始检查任务i ' + (i+1) +'/' + allRecords.length)

      let collideInfos = []
      
      for (let j = 0; j < allRecords.length; j++) {
        
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

  console.debug('冲突任务： ', JSON.stringify(collideRecords))
  console.log('总共有 %d 条冲突任务', collideRecords.length)
  
  // batch update records
    // /*
    await client.base.appTableRecord.batchUpdate({
      path: {
        table_id: TABLEID,
      },
      data: {
        records: collideRecords
      }
    })
    // */

  const e = performance.now();
  console.log('检查完毕,耗时：'+ (e-s)/1000 + 's')
}


console.log('start')