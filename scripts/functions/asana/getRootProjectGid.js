//別定義のgetTaskDetails関数を利用して親プロジェクトGIDと階層数を取得する関数
function getRootProjectGid(asanaApiToken, parentTasksGid){
  //階層数の初期値
  let hierarchical_num = 1;
  //親タスクの詳細を確認
  let parentTaskDetail = getTaskDetails(asanaApiToken, parentTasksGid);
  let returnParent = parentTaskDetail["data"]["parent"];
  let returnProjects = parentTaskDetail["data"]["projects"];
  
  while ( returnParent != null ){
    let newParentTasksGid = returnParent["gid"];
    newParentTaskDetail = getTaskDetails(asanaApiToken, newParentTasksGid);
    returnParent = newParentTaskDetail["data"]["parent"];
    returnProjects = newParentTaskDetail["data"]["projects"];
    hierarchical_num++;
  }
  let projects_gid_list = [];
  for(let i=0; i<returnProjects.length; i++){
    projects_gid_list.push(returnProjects[i]["gid"]);
  }    
  
  return {
    "hierarchical_num": hierarchical_num,
    "projects_gid_list": projects_gid_list
  };
}