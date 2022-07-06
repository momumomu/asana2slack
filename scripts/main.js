//対象のSlackWorkspaceのURLをを定義
const slackWorkspaceUrl = "https://moneyforward.slack.com";

function main() {
  //初期値
  let stateList = []; //状態記録用のスプレッドシートに最終的に書き込む用のlistを定義しておく。

  //スクリプト実行ユーザーのemailを取得
  const myEmailAddress = Session.getEffectiveUser().getEmail();
  // console.log(myEmailAddress)
  // if ( "shimomura.atsushi@moneyforward.co.jp" != myEmailAddress ){
  //   return
  // }
  const myId = myEmailAddress.replace(/@.*/, ""); //ホスト部分だけを抽出。
  const stateSheetName = "state_" + myId;
  //Propertyサービスの定義
  var userProperties = PropertiesService.getUserProperties();
  
  //各種値をUserProperyから取得
  const asanaApiToken = userProperties.getProperty('asanaApiToken');
  const slackApiToken = userProperties.getProperty('slackApiToken');
  const asanaWorkspaceId = userProperties.getProperty('asanaWorkspaceId');
  const myAsanaUserId = userProperties.getProperty('myAsanaUserId');
  const privateProjectGid = userProperties.getProperty('privateProjectGid');
  const myProjectGid = Number(userProperties.getProperty('myProjectGid'));
  const mySlackId = userProperties.getProperty('mySlackId');
  const dueDateNum = Number(userProperties.getProperty('dueDate'));
  let dueDate = new Date(); //dueDate分を加算した未来日を定義。
  dueDate.setDate(dueDate.getDate() + dueDateNum); //dueDate分を加算した未来日を定義。

  //UserPropertyが無いときの処理
  userPropertiesList = [
    asanaApiToken,
    slackApiToken,
    asanaWorkspaceId,
    myAsanaUserId,
    privateProjectGid,
    mySlackId,
    dueDateNum,
    myProjectGid
  ]
  for(let i=0; i<userPropertiesList.length; i++){
    if ( userPropertiesList[i] === null ){
      console.log("初期設定がされていないのでスキップします")
      return; //たぬきを押していないのでスキップ
    }
  };

  //Slackからの連携先Asanaプロジェクトを定義する
  let targetProjectId;
  if ( myProjectGid != "" ){
    try {
      getDetailProject(asanaApiToken, myProjectGid);
      targetProjectId = String(myProjectGid); //プロジェクト情報が取れるなら続行
    } catch {
      targetProjectId = String(privateProjectGid); //プロジェクト情報がとれなかったときはPrivateのやつを使う
    }
  } else {
    targetProjectId = String(privateProjectGid);
  }
  console.log("targetProjectId:", targetProjectId)
    
  //スプレッドシートの「stateSheetName」シートから過去のAsanaタスクへの登録履歴を得る
  const spreadSheetClass = SpreadsheetApp.getActive();
  try {
    spreadSheetClass.insertSheet(stateSheetName); //該当シートがない場合は作成する
  } catch {
  }
  const sheetClass = spreadSheetClass.getSheetByName(stateSheetName);
  sheetClass.hideSheet(); //事故防止のためシートを隠しておく
  const sheetArray = sheetClass.getDataRange().getValues(); //シートの内容を配列に入れておく
  let recentlyAsanaTasksList = [];
  for(let i=0; i<sheetArray.length; i++){ //シートに記載されている内容を配列に入れる
    recentlyAsanaTasksList.push(sheetArray[i][0]); //シートに記載されているSlackUrlをリストに代入する
  }
  recentlyAsanaTasksList = Array.from(new Set(recentlyAsanaTasksList)); //念の為重複排除しておく
  
  //現状のSavedItemsの一覧を取得
  let currentSlackSavedItemsDict = listSavedItems(slackApiToken, slackWorkspaceUrl);
  let currentSlackSavedItemsDictKeys = Object.keys(currentSlackSavedItemsDict); //SavedItemのキーのリストのみ
  currentSlackSavedItemsDictKeys = Array.from(new Set(currentSlackSavedItemsDictKeys)); //念の為重複排除しておく
    
  //現状の自分がオーナーのAsanaタスクの一覧を取得
  //※ただし、サブタスクのサブタスクやプロジェクトに紐付いていないタスク(マイタスク)は対象外にする。
  let allCurrentAsanaTasks = getActiveTasks(asanaApiToken, asanaWorkspaceId, myAsanaUserId, targetProjectId);
  let currentAsanaTasks = allCurrentAsanaTasks["existSavedItem"];
  let currentAsanaTasksKeys = Object.keys(currentAsanaTasks); //SavedItemのキーのリストのみ
  currentAsanaTasksKeys = Array.from(new Set(currentAsanaTasksKeys)); //念の為重複排除しておく
  //現状の自分がオーナーだが、slack_urlが存在しないタスク一覧
  currentAsanaTasksNotExistSavedItem = allCurrentAsanaTasks["notExistSavedItem"];
  currentAsanaTasksNotExistSavedItemKeys = Object.keys(currentAsanaTasksNotExistSavedItem);
  currentAsanaTasksNotExistSavedItemKeys = Array.from(new Set(currentAsanaTasksNotExistSavedItemKeys)); //念の為重複排除しておく
  
  // //debug
  // for(let i=0; i<currentAsanaTasksKeys.length; i++){
  //   dictKey = currentAsanaTasksKeys[i];
  //   dict = currentAsanaTasks[dictKey];
  //   if ( dict["subject"] == "孫タスク"){
  //     console.log("currentAsanaTasks")
  //     console.log(dict)
  //   }
  // }
  // for(let i=0; i<currentAsanaTasksNotExistSavedItemKeys.length; i++){
  //   dictKey = currentAsanaTasksNotExistSavedItemKeys[i];
  //   dict = currentAsanaTasksNotExistSavedItem[dictKey];
  //   if ( dict["subject"] == "孫タスク"){
  //     console.log("currentAsanaTasksNotExistSavedItem")
  //     console.log(dict)
  //   }
  // }
  // return

  // /*
  // ------------------------------------------------------------------------------------------
  // 下記の状態のものを処理する。

  // 1. Asanaのタスクが自分の担当者になっている
  // 2. Asanaで「slack_url」が登録されていない(≒Saved itemsとAsanaタスクの同期が取られていないもの)

  // 処理内容
  // → Saved itemsに追加登録
  // ------------------------------------------------------------------------------------------
  // */  
  // for(let i=0; i<currentAsanaTasksNotExistSavedItemKeys.length; i++){
  //   let dictKey = currentAsanaTasksNotExistSavedItemKeys[i];
  //   let asanaTaskDict = currentAsanaTasksNotExistSavedItem[dictKey];
  //   let completed = asanaTaskDict["completed"];
  //   if ( completed != false ){
  //     continue //タスクがアクティブでないので無視
  //   }
  //   let slackText = "■Asanaタスク\n\n" + asanaTaskDict["subject"] + "\n\n" + asanaTaskDict["permalinkUrl"]
  //   let chatPostMessageResponse = chatPostMessage(
  //     slackApiToken,
  //     mySlackId,
  //     slackText
  //   )
  //   addSavedItems(
  //     slackApiToken,
  //     chatPostMessageResponse["channel"],
  //     chatPostMessageResponse["message"]["ts"]
  //   )
  //   let slackUrl = slackWorkspaceUrl + "/archives/" + chatPostMessageResponse["channel"] + "/p" + chatPostMessageResponse["message"]["ts"].replace(".",""); //SlackURLを生成する
  //   let subtaskBool
  //   if ( asanaTaskDict["parent"] === null ){
  //     subtaskBool = false;
  //   } else {
  //     subtaskBool = true;
  //   }
  //   updateTask(
  //     asanaApiToken,
  //     asanaTaskDict["gid"],
  //     slackUrl,
  //     "addSlackUrl",
  //     asanaTaskDict["projects_gid_list"]
  //   )
  //   console.log("update-Asana-Task", dictKey);
  //   console.log(asanaTaskDict);
  // }

  /*
  ------------------------------------------------------------------------------------------
  下記の状態のものを処理する。

  1. SlackのSaved itemsに存在する
  2. Asanaタスクに無い

  そのうえで...
  スプレッドシートの「state_xxxxx」シート(recentlyAsanaTasksList)に記載が
    ある → SlackのSaved itemsを解除する。(Asana側で担当者が変わった等の理由のため)
    ない → AsanaタスクをSaved itemsの内容で作成する。(Slack側で新規にSaved itemsに登録したと想定されるため)
  
  ※下記は「AsanaタスクをSaved itemsの内容で作成する」の処理を行う。
  (「SlackのSaved itemsを解除する」は別箇所で行う)
  ------------------------------------------------------------------------------------------
  */
  for(let i=0; i<currentSlackSavedItemsDictKeys.length; i++){
    let dictKey = currentSlackSavedItemsDictKeys[i];
    if ( ! currentAsanaTasksKeys.includes(dictKey) ){
      if (recentlyAsanaTasksList.includes(dictKey)){
        //スプレッドシートに値が存在しない(≒過去にAsana登録済みではない)場合、処理を継続する
        continue; //スプレッドシートに値があるのでスキップ
      }      
      //存在しない場合Asanaタスクを作る
      //事前処理
      let slackText = currentSlackSavedItemsDict[dictKey]["slackText"]; //投稿文言
      let slackUserId = currentSlackSavedItemsDict[dictKey]["slackUserId"]; //発言者のID

      //発言者が誰かをslackTextの末尾に追記する。
      slackText = slackText + "\n\nfrom: <@" + slackUserId + ">";

      //メンション文字列をSlackNameに変換する
      let slackMentionMemberList = slackText.match(/\<@U.*?\>/g); //メンション文字列一覧を取得
      if ( slackMentionMemberList === null ){ //メンション文字列が無かった場合の処理
        slackMentionMemberList = [];
      }
      for(let j=0; j<slackMentionMemberList.length; j++){
        let mentionValue = slackMentionMemberList[j];
        //余計な文字列消す
        let slackUserId = mentionValue.replace("<@", "")
                                      .replace(">", "")
        let slackName = convertIdToName(slackApiToken, slackUserId);
        //SlackNameに置き換え処理
        slackText = slackText.replace(
          mentionValue,
          "@" + slackName
        )
      }
      console.log("createTask")
      createTask(
        asanaApiToken,
        myAsanaUserId,
        asanaWorkspaceId,
        targetProjectId,
        dictKey, //Asanaタスクに格納するSlackUrl
        slackText, //Asanaタスクの件名
      )
      console.log(currentSlackSavedItemsDict[dictKey])
      console.log("add-Asana-Task", dictKey);
    } 
  }

  // /*
  // ------------------------------------------------------------------------------------------
  // 下記の状態のものを処理する。

  // 1. SlackのSaved itemsに存在する
  // 2. Asanaタスクに無い

  // そのうえで...
  // スプレッドシートの「state_xxxxx」シート(recentlyAsanaTasksList)に記載が
  //   ある → SlackのSaved itemsを解除する。(Asana側で担当者が変わった等の理由のため)
  //   ない → AsanaタスクをSaved itemsの内容で作成する。(Slack側で新規にSaved itemsに登録したと想定されるため)
  
  // ※下記は「SlackのSaved itemsを解除する」の処理を行う。
  // (「AsanaタスクをSaved itemsの内容で作成する」は別箇所で行う)
  // ------------------------------------------------------------------------------------------
  // */
  // for(let i=0; i<currentSlackSavedItemsDictKeys.length; i++){
  //   let dictKey = currentSlackSavedItemsDictKeys[i];
  //   if ( ! currentAsanaTasksKeys.includes(dictKey) ){
  //     if ( ! recentlyAsanaTasksList.includes(dictKey)){
  //       //スプレッドシートに値が存在する(≒過去にAsana登録済み)場合、処理を継続する
  //       continue; //スプレッドシートに値がないのでスキップ
  //     }
  //     let slackItem = currentSlackSavedItemsDict[dictKey];
  //     console.log("remove-star", dictKey);
  //     removeSavedItems( //SavedItemsを外す
  //       slackApiToken,
  //       slackItem["channel"],
  //       slackItem["timestamp"],
  //     )
  //   }
  // }

  /*
  ------------------------------------------------------------------------------------------
  下記の状態のものを処理する。

  1. Asana側でタスクが完了している(completedがtrue)
  2. SlackのSaved itemsに存在するもの

  処理内容：
  → Saved itemsから解除する。
  ------------------------------------------------------------------------------------------
  */
  for(let i=0; i<currentAsanaTasksKeys.length; i++){
    let dictKey = currentAsanaTasksKeys[i];
    let completedBool = currentAsanaTasks[dictKey]["completed"]; //完了フラグ
    if ( completedBool != true ){
      continue //完了になっていないのでスキップ
    };
    if ( currentSlackSavedItemsDictKeys.includes(dictKey) ){
      let slackItem = currentSlackSavedItemsDict[dictKey];
      console.log("remove-star", dictKey);
      removeSavedItems( //SavedItemsを外す
        slackApiToken,
        slackItem["channel"],
        slackItem["timestamp"]
      )
    }
  }

  // /*
  // ------------------------------------------------------------------------------------------
  // 下記の状態のものを処理する
  // 1. Asanaのタスクに自分が担当者になっている。(※ただしcompleted=trueは無視)
  // 2. SlackのSaved itemsに存在しない。
  
  // そのうえで...
  // スプレッドシートの「state_xxxxx」シート(recentlyAsanaTasksList)に記載が
  //   ある → Asanaのタスクを完了(completed=true)にする。
  //   ない → SlackのSaved itemsに追加する。
  //         ※ただし、Asanaタスクが事前に設定した期日(DueDate)以上ならスキップする
  //         ※Asanaタスクの期日が設定されていない場合などはSaved itemsに追加する。
  
  // ※下記は「Asanaのタスクを完了(completed=true)にする」の処理。
  // (「SlackのSaved itemsに追加する」は別箇所で対応)
  // ------------------------------------------------------------------------------------------
  // */
  // for(let i=0; i<currentAsanaTasksKeys.length; i++){
  //   //諸々の変数や初期値
  //   const dictKey = currentAsanaTasksKeys[i];
  //   const slackUrl = dictKey;
  //   const dict = currentAsanaTasks[dictKey];
  //   existRecentlyAsanaTasksList = null; //recentlyAsanaTasksListに存在するか否かのbool
  //   //Saved itemsにあるか確認
  //   if (currentSlackSavedItemsDictKeys.includes(dictKey)){
  //     continue //Saved itemsに存在するのでskip
  //   };
  //   //Asanaタスクの状況を確認
  //   let completedBool = dict["completed"]; //完了フラグ
  //   if ( completedBool === true ){
  //     continue //完了しているのでスキップ
  //   };
  //   //recentlyAsanaTasksListの確認
  //   if (! recentlyAsanaTasksList.includes(dictKey)){
  //     continue; //スプレッドシート上に記載が無いのでスキップ
  //   }
  //   //タスクを完了する
  //   updateTask(
  //     asanaApiToken,
  //     dict["gid"],
  //     slackUrl,
  //     "completed",
  //     []
  //   )
  //   console.log("completed-Asana-Task:", dictKey);  
  // }

  // /*
  // ------------------------------------------------------------------------------------------
  // 下記の状態のものを処理する
  // 1. Asanaのタスクに自分が担当者になっている。(※ただしcompleted=trueは無視)
  // 2. SlackのSaved itemsに存在しない。
  
  // そのうえで...
  // スプレッドシートの「state_xxxxx」シート(recentlyAsanaTasksList)に記載が
  //   ある → Asanaのタスクを完了(completed=true)にする。
  //   ない → SlackのSaved itemsに追加する。
  //         ※ただし、Asanaタスクが事前に設定した期日(DueDate)以上(equal to or greater than)ならスキップする
  //         ※Asanaタスクの期日が設定されていない場合などはSaved itemsに追加する。
  
  // ※下記は「SlackのSaved itemsに追加する」の処理。
  // (「Asanaのタスクを完了(completed=true)にする」は別箇所で対応)
  // ------------------------------------------------------------------------------------------
  // */
  // for(let i=0; i<currentAsanaTasksKeys.length; i++){
  //   //諸々の変数や初期値
  //   const dictKey = currentAsanaTasksKeys[i];
  //   const slackUrl = dictKey;
  //   const dict = currentAsanaTasks[dictKey];
  //   existRecentlyAsanaTasksList = null; //recentlyAsanaTasksListに存在するか否かのbool
  //   //Saved itemsにあるか確認
  //   if (currentSlackSavedItemsDictKeys.includes(dictKey)){
  //     continue //Saved itemsに存在するのでskip
  //   };
  //   //Asanaタスクの状況を確認
  //   let completedBool = dict["completed"]; //完了フラグ
  //   if ( completedBool === true ){
  //     continue //完了しているのでスキップ
  //   };
  //   //recentlyAsanaTasksListの確認
  //   if (recentlyAsanaTasksList.includes(dictKey)){
  //     continue; //スプレッドシート上に記載があるのでスキップ
  //   }
  //   //期日(DueDate)をチェック
  //   if ( dict["due_on"] != null ){
  //     let currentTaskDueDate = new Date(dict["due_on"]); //現在のタスクに設定されている期日を取得する
  //     if ( dueDate <= currentTaskDueDate) {
  //       continue //期日以上なのでスキップ
  //     }
  //   }    
  //   //Saved itemsに追加するためURLから必要情報を取得する
  //   //URL sample: https://moneyforward.slack.com/archives/C022NK88X2L/p1640452598000100?thread_ts=1640354517.017400&cid=C022NK88X2L
  //   let channelName = slackUrl.replace(slackWorkspaceUrl + "/archives/", "")
  //                             .replace(/\/.*/g,"");
  //   let timeStampOrg = slackUrl.replace(slackWorkspaceUrl + "/archives/", "")
  //                              .replace(channelName + '/p', "")
  //                              .replace(/\?.*/g,"");
  //   let timeStamp = timeStampOrg.substring(0,10) + "." + timeStampOrg.substring(10);
  //   //Saved itemsに追加する
  //   addSavedItems(
  //     slackApiToken,
  //     channelName,
  //     timeStamp
  //   );
  //   console.log("add-savedItems:", slackUrl);
  // }

  // /*
  // ------------------------------------------------------------------------------------------
  // 下記の状態のものを処理する
  // 1. Asanaタスクが事前に設定した期日(DueDate)より大きい(greater than)ならSaved itemsから外す。
  // ※Asanaタスクの期日が設定されていない場合などはスキップする。
  // ------------------------------------------------------------------------------------------
  // */
  // for(let i=0; i<currentAsanaTasksKeys.length; i++){
  //   let dictKey = currentAsanaTasksKeys[i];
  //   let dict = currentAsanaTasks[dictKey];
  //   if ( dict["due_on"] != null ){
  //     let currentTaskDueDate = new Date(dict["due_on"]); //現在のタスクに設定されている期日を取得する
  //     if ( dueDate < currentTaskDueDate) {
  //       //期日以上なのでSaved Itemを外す
  //       if ( currentSlackSavedItemsDictKeys.includes(dictKey) ){
  //         removeSavedItems( //SavedItemsを外す
  //           slackApiToken,
  //           currentSlackSavedItemsDict[dictKey]["channel"],
  //           currentSlackSavedItemsDict[dictKey]["timestamp"]
  //         );
  //         console.log("remove-star", dictKey);
  //       }
  //     }
  //   };
  // }

  /*
  ------------------------------------------------------------------------------------------
  Asanaのタスク一覧でスプレッドシートを上書き更新する
  ※ただし下記状態のものは除外する。

  1. Asanaタスクが完了(completedがtrue)のもの
  2. Asanaタスクの期日(DueDate)が期日以上(equal to or greater than)のもの
     ※ただしAsanaタスクの期日が設定されていないものはスプレッドシートに記載する。
  ------------------------------------------------------------------------------------------
  */
  //改めて現状の自分がオーナーのAsanaタスクの一覧を取得
  let newAllCurrentAsanaTasks = getActiveTasks(asanaApiToken, asanaWorkspaceId, myAsanaUserId);
  let newCurrentAsanaTasks = newAllCurrentAsanaTasks["existSavedItem"];
  let newCurrentAsanaTasksKeys = Object.keys(newCurrentAsanaTasks); //SavedItemのキーのリストのみ
  newCurrentAsanaTasksKeys = Array.from(new Set(newCurrentAsanaTasksKeys)); //念の為重複排除しておく
  //スプレッドシートの更新
  sheetClass.clear(); //値を全消去する
  for(let i=0; i<newCurrentAsanaTasksKeys.length; i++){
    const slackUrl = newCurrentAsanaTasksKeys[i];
    const dict = newCurrentAsanaTasks[slackUrl];
    //タスクがcompletedならスキップ
    if ( dict["completed"] == true ){
      continue;
    }
    //タスクがDueDate(期日)より大きければスキップ
    let currentTaskDueDate = new Date(dict["due_on"]); //現在のタスクに設定されている期日を取得する
    if ( dict["due_on"] != null ){
      if ( dueDate <= currentTaskDueDate) {
        continue;
      }
    }
    sheetClass.appendRow([
      slackUrl
    ]);
  };
  sheetClass.hideSheet(); //事故防止のためシートを隠しておく
}
