function chatPostMessage(slackApiToken, channel, text){
  //headerを定義
  headers = {
    'Authorization': 'Bearer ' + slackApiToken,
    'Content-Type': 'application/json'
  }
  //optionsを定義
  const payload = {
    "text": text,
    "channel": channel,
    "as_user": true
  }
  const options = {
    'method': 'post',
    "payload" : JSON.stringify(payload),
    'headers': headers
  }
  //console.log(options)
  
  //endpointURLの生成
  const endpoint_url = "https://slack.com/api" + "/chat.postMessage";
  //console.log(endpoint_url);
  
  //post処理を実行
  const response = UrlFetchApp.fetch(endpoint_url, options);
  const responseJson = JSON.parse(response);
  
  return responseJson;
}