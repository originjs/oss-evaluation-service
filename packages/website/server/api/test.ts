import {GithubProjects}  from '@orginjs/oss-evaluation-data-model';

export default defineEventHandler(async (event)=>{
 const data = await GithubProjects.findOne();
  return {
    message: 'test server:' + JSON.stringify(data) 
  }
})