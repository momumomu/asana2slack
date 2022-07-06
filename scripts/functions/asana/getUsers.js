function getUsers(asanaApiToken, asanaWorkspaceId, targetUserEmail){
  /*
  targetUserEmail -> UserGIDを取得したい対象ユーザーのemail
  */
  //headerを定義
  headers = {
    'Authorization': 'Bearer ' + asanaApiToken,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
  //optionsを定義
  const options = {
    'method': 'get',
    'headers': headers
  }
  //endpointURLを生成(/users?workspace=108897034660210&limit=100)
  const endpoint_url = "https://app.asana.com/api/1.0" + "/users" + "?opt_fields=email" + "&workspace=" + asanaWorkspaceId + "&limit=100";
  
  //GET処理
  let response = UrlFetchApp.fetch(endpoint_url, options);
  let responseJson = JSON.parse(response);

  //合致するユーザー名が存在するまでloop
  let loop_bool = true;
  while(loop_bool){
    for(let i=0; i<responseJson["data"].length; i++){
      let email = responseJson["data"][i]["email"];
      if (email == targetUserEmail){
        return responseJson["data"][i]["gid"]; //gidを返却して終了
      }
    }
    //次ページが無い場合(ユーザーがAsanaに居ない場合)はnullを返却して終了
    if (responseJson["next_page"] === null){
      return null
    }
    //次ページがある場合は再度クエリを投げて再ループ
    let endpoint_url_2 = endpoint_url + "&offset=" + responseJson["next_page"]["offset"];
    //console.log("debug(users)", endpoint_url_2)
    response = UrlFetchApp.fetch(endpoint_url_2, options);
    responseJson = JSON.parse(response);
  }
}