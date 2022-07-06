//初期設定を行うための関数
//※呼び出しはスプレッドシートのボタンから行う。

const asanaOrgName = "moneyforward.co.jp";

function initialize(){
  //スクリプト実行ユーザーのemailを取得
  const myEmailAddress = Session.getEffectiveUser().getEmail();
  const myId = myEmailAddress.replace(/@.*/, ""); //ホスト部分だけを抽出。

  //Propertyサービスの定義
  const userProperties = PropertiesService.getUserProperties();
  
  /*
  ==手入力箇所===========================================================
  */
  //AsanaのTokenを確認
  if ( userProperties.getProperty('asanaApiToken') === null){
    var dummyText = "なし";
  } else {
    var dummyText = userProperties.getProperty('asanaApiToken').substring(0,10) + "xxxxxxxxxxxx";
  }
  const inputAsanaApiToken = Browser.inputBox("AsanaのAPI Tokenを入力してください。\\n(現状の値をそのまま使うならキャンセルしてください)\\n\\n現状の値 → " + dummyText , Browser.Buttons.OK_CANCEL);
  if ( (inputAsanaApiToken != "cancel") && (inputAsanaApiToken != "") ){
    userProperties.setProperty('asanaApiToken', inputAsanaApiToken);
  }
  const asanaApiToken = userProperties.getProperty('asanaApiToken');
  //SlackのTokenを確認
  if ( userProperties.getProperty('slackApiToken') === null){
    var dummyText = "なし";
  } else {
    var dummyText = userProperties.getProperty('slackApiToken').substring(0,10) + "xxxxxxxxxxxx";
  }
  const inputSlackApiToken = Browser.inputBox("SlackのAPI Tokenを入力してください。\\n(現状の値をそのまま使うならキャンセルしてください)\\n\\n現状の値 → " + dummyText , Browser.Buttons.OK_CANCEL);
  if ( (inputSlackApiToken != "cancel") && (inputSlackApiToken != "") ){
    userProperties.setProperty('slackApiToken', inputSlackApiToken);
  }
  const slackApiToken = userProperties.getProperty('slackApiToken');
  //期日から何日以内のものをSavedItemsに表示させるのか定義
  if ( userProperties.getProperty('dueDate') === null){
    var dummyText = "99999";
    userProperties.setProperty('dueDate', 99999);
  } else {
    var dummyText = userProperties.getProperty('dueDate')
  }
  const inputDueDate = Browser.inputBox(
    "SlackのSaved itemsに期日が何日以内のものを表示させるか指定してください。\\n※1Asanaタスク上で期日が設定されていないものはSaved itemに表示させます。\\n※2 全部含める場合は「99999」と入れてください。\\n\\n現状の値 → " + dummyText , Browser.Buttons.OK_CANCEL
  );
  if ( (inputDueDate != "cancel") && (inputDueDate != "") ){
    userProperties.setProperty('dueDate', inputDueDate);
  }
  //const dueDate = userProperties.getProperty('dueDate');
  //Slackから連携されるAsanaプロジェクトを自分用にカスタマイズするときに使う
  //https://app.asana.com/0/1201589219439074/list
  if ( userProperties.getProperty('myProjectGid') === null){
    var dummyText = "なし";
  } else {
    if ( userProperties.getProperty('myProjectGid') == "" ){
      var dummyText = "なし";
    } else {
      var dummyText = userProperties.getProperty('myProjectGid');
      dummyText = 'https://app.asana.com/0/' + String(dummyText) + '/list'
    }
  }
  let input_myProjectGid = Browser.inputBox(
    "Asanaの任意のプロジェクトに保管したい場合はそのプロジェクトのURLを入力してください。\\n入力例： https://app.asana.com/0/1201589219000000/list \\n ※1 特に保存先が無いor値を消去したい場合→空欄のまま「OK」を押してください。\\n※2 現状の値をそのまま利用したい場合→「キャンセル」を押してください。\\n\\n現状の値 → " + dummyText , Browser.Buttons.OK_CANCEL
  );
  if ( (input_myProjectGid != "cancel") && (input_myProjectGid != "") ){
    input_myProjectGid = input_myProjectGid.replace('https://app.asana.com/0/','');
    input_myProjectGid = input_myProjectGid.replace(/\/.*/g, '');
    userProperties.setProperty('myProjectGid', input_myProjectGid);
  } else {
    if ( input_myProjectGid == "" ){
      userProperties.setProperty('myProjectGid', "");
    }
  }
  //const dueDate = userProperties.getProperty('dueDate');

  /*
  ===================================================================
  自分自身のSlackIDを取得する
  ===================================================================
  */
  userProperties.setProperty('mySlackId', userLookupByEmail(slackApiToken, myEmailAddress));

  /*
  ==Asana系の初期処理を実行================================================
  */
  //個人用途のPrivateのTeam名とProject名を定義
  const privateTeamName = "private_team_" + myId;
  const privateProjectName = "MyTasks";
  
  //WorkspaceIDを取得(UserPropertyに登録されていればそれを使う)
  if ( userProperties.getProperty('asanaWorkspaceId') === null ){
    const getAsanaWorkspaceId = getWorkspace(asanaApiToken, asanaOrgName);
    userProperties.setProperty('asanaWorkspaceId', getAsanaWorkspaceId);
  }
  const asanaWorkspaceId = userProperties.getProperty('asanaWorkspaceId');

  //スクリプト実行ユーザーのAsanaUserGidを取得(UserPropertyに登録されていればそれを使う)
  //const myAsanaUserId = '1201538044657377';
  if ( userProperties.getProperty('myAsanaUserId') === null ){
    const getMyAsanaUserId = getUsers(asanaApiToken, asanaWorkspaceId, myEmailAddress);
    userProperties.setProperty('myAsanaUserId', getMyAsanaUserId);
  }
  const myAsanaUserId = userProperties.getProperty('myAsanaUserId');

  //PrivateTeamが存在するか確認
  let privateTeamGid = getTeams(
    asanaApiToken,
    asanaWorkspaceId,
    myAsanaUserId,
    privateTeamName
  );

  //PrivateTeamのIDが取得できなかった場合はPrivateTeamを作成する
  if ( privateTeamGid === null){
    privateTeamGid = createTeam(
      asanaApiToken,
      asanaWorkspaceId,
      myEmailAddress,
      privateTeamName
    )
    Utilities.sleep(1000); //1秒sleep
  }

  //PrivateTeam上にProjectが存在するか確認する
  let privateProjectGid = getProject(
    asanaApiToken,
    privateTeamGid,
    privateProjectName
  );

  //PrivateTeam上にProjectが存在しなければ作成する
  if ( privateProjectGid === null){
    createProject(
      asanaApiToken,
      privateTeamGid,
      privateProjectName
    )
    Utilities.sleep(5000); //5秒sleep
  };
  //UserPropertyに登録が無ければ登録
  if ( userProperties.getProperty('privateProjectGid') === null ){
    userProperties.setProperty('privateProjectGid', privateProjectGid);
  } else {
    if ( userProperties.getProperty('privateProjectGid') != privateProjectGid ){
      userProperties.setProperty('privateProjectGid', privateProjectGid);
    }
  }

  //Project上に"slack_url"というカスタムフィールドがあるか確認する
  let customFieldGid = getCustomFieldToProject(
    asanaApiToken,
    privateProjectGid,
    "slack_url"
  );

  //Project上に"slack_url"というカスタムフィールドがなければ作成する
  Utilities.sleep(10000); //10秒sleep
  if ( customFieldGid === null){
    customFieldGid = addCustomFieldToProject(
      asanaApiToken,
      privateProjectGid,
      "slack_url"
    )
  };

  /*
  Triggerの設定
  */
  createTrigger();

  /*
  ==結果確認===========================================================
  */
  // let settingsText = "初期設定が完了しました。\\n\\n■(ご参考までに)現在の値\\n\\n"
  // settingsText = settingsText + "slack token:\\n" + slackApiToken.substring(0,8) + "xxxxxxxxxx" + "\\n\\n"
  // settingsText = settingsText + "asana token:\\n" + asanaApiToken.substring(0,8) + "xxxxxxxxxx" + "\\n\\n"
  // settingsText = settingsText + "asana workspaceid:\\n" +   asanaWorkspaceId + "\\n\\n"
  // settingsText = settingsText + "asana userid:\\n" + myAsanaUserId + "\\n\\n"
  // Browser.msgBox(settingsText);
  Browser.msgBox("初期設定が完了しました。\\n続いてSlackとAsanaタスクの同期を行います。\\n※完了までに5分程度かかります。");
  main();
  Browser.msgBox("SlackとAsanaタスクの同期が完了しました。");

}

function initialize_debug(){
  //設定済、UserPropertyの確認
  const userProperties = PropertiesService.getUserProperties();
  console.log("asanaApiToken", userProperties.getProperty('asanaApiToken'));
  console.log("slackApiToken", userProperties.getProperty('slackApiToken'));
  console.log("asanaWorkspaceId", userProperties.getProperty('asanaWorkspaceId'));
  console.log("myAsanaUserId", userProperties.getProperty('myAsanaUserId'));
  console.log("privateProjectGid", userProperties.getProperty('privateProjectGid'));
  console.log("mySlackId", userProperties.getProperty('mySlackId'));
  console.log("dueDate", userProperties.getProperty('dueDate'));
  console.log("myProjectGid", userProperties.getProperty('myProjectGid'))
}