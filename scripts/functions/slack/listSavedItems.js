function listSavedItems(slackApiToken, slackWorkspaceUrl){
  /*
  結果を格納するdictを定義
  下記のようなdictを格納する想定
  {
    SlackLinkUrl: {
      "slackText": <slack投稿内容>,
      "slackUserId": <投稿者のID>,
      "SlackLinkUrl": <投稿されたSlackのLinkURL>,
      "timestamp": <starされたタイムスタンプ？>,
      "channel": 投稿されたメッセージの含まれるチャンネル
    }
  }
  */
  let return_dict = {}; //結果を格納するlist
  
  //headerを定義
  headers = {
    'Authorization': 'Bearer ' + slackApiToken,
    'Content-Type': 'application/x-www-form-urlencoded'
  }
  //optionsを定義
  var options = {
    'method': 'get',
    'contentType': 'application/json',
    'headers': headers
  }
  
  const endpoint_url = "https://slack.com/api/stars.list?limit=100";
  let response = UrlFetchApp.fetch(endpoint_url, options);
  let responseJson = JSON.parse(response);

  let loop_bool = true;
  while(loop_bool){
    for(let i=0; i<responseJson["items"].length; i++){
      let slackItem = responseJson["items"][i];
      let type = slackItem["type"]; //mesagesを期待する。
      if ( type == "message" ){
        let SlackLinkUrl = slackItem["message"]["permalink"];
        return_dict[SlackLinkUrl] = { //取得結果を格納
          "slackText": slackItem["message"]["text"],
          "slackUserId": slackItem["message"]["user"],
          "SlackLinkUrl": SlackLinkUrl,
          "timestamp": slackItem["message"]["ts"],
          "channel": slackItem["channel"],
        };
      };
    }
    
    //次ページがあれば取得する
    let nextCursor = responseJson["response_metadata"]["next_cursor"];
    if ( nextCursor == "" ){
      loop_bool = false;
    }
    let endpoint_url_2 = endpoint_url + '&cursor=' + nextCursor;
    response = UrlFetchApp.fetch(endpoint_url_2, options);
    responseJson = JSON.parse(response);
  }
  return return_dict
}