/*
自分用のタスクを保管するため自分ひとりしか存在しないTeamを作成。
("private_team_ホスト名"という形式で作成する。
*/
function createTeam(asanaApiToken, asanaWorkspaceId, myEmailAddress, privateTeamName){
  //emailからホスト部分だけを抽出
  const myId = myEmailAddress.replace(/@.*/, "");
  
  //headerを定義
  headers = {
    'Authorization': 'Bearer ' + asanaApiToken,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
  //optionsを定義
  const payload = {
    "data": {
      "organization": asanaWorkspaceId,
      "name" : privateTeamName
    }
  }
  const options = {
    "payload" : JSON.stringify(payload),
    'method': 'post',
    'headers': headers,
    'muteHttpExceptions': true //エラーを無視する
  }  
  //endpointURLの生成
  const endpoint_url = "https://app.asana.com/api/1.0" + "/teams"

  //post処理を実行
  const response = UrlFetchApp.fetch(endpoint_url, options);
  const responseJson = JSON.parse(response);
  //console.log(responseJson);

  //GIDを返却
  return responseJson["data"]["gid"];
}