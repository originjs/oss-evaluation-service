import {GithubProjects}  from 'data-orm';

export default defineEventHandler(async (event)=>{
 const data = await GithubProjects.findOne();
  return {
    message: 'test server:' + JSON.stringify(data) 
  }
})