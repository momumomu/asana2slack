function getActiveTasks(asanaApiToken, asanaWorkspaceId, myAsanaUserId, targetProjectId){
  /*
  返却用のdictの初期値を宣言する。
  下記のようなdictを返却する想定
  {
    slack_url: { <- 別関数で取得したSlackのURLをAsanaタスクに埋め込んでいる値
      "subject": <タスクの件名>,
      "completed": <asana上でタスクが完了しているか否かのbool値>
      "gid": <そのタスクのGID(念の為,取得しておく)>,
      "slackUrl": Asanaに格納されているSlackURLの値
    }
  }
  */
  let return_dict = {};
  return_dict["existSavedItem"] = {};
  return_dict["notExistSavedItem"] = {};


  //スクリプト実行日時の7日前の値をISO8601形式で取得
  //(Asanaがその形式でないとだめなので&7日前までのタスク状況を確認したいため)
  const date = new Date();
  date.setDate(date.getDate() -7);
  let dateISO8601 = date.toISOString();
  dateISO8601 = dateISO8601.replace(/:/g, "%3A");
  
  //headerを定義
  headers = {
    'Authorization': 'Bearer ' + asanaApiToken,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
  //optionsを定義
  var options = {
    'method': 'get',
    'contentType': 'application/json',
    'headers': headers
  }
  
  ///tasks?opt_fields=completed,completed_at&assignee=1201538044657377&completed_since=2021-12-24T05%3A07%3A43.413Z&limit=10&workspace=108897034660210
  const endpoint_url = "https://app.asana.com/api/1.0" + "/tasks" + "?opt_fields=completed,custom_fields,name,projects,due_on,parent" + "&workspace=" + asanaWorkspaceId + '&assignee=' + myAsanaUserId   + '&completed_since=' + dateISO8601 + "&limit=100";
  var response = UrlFetchApp.fetch(endpoint_url, options);
  var responseJson = JSON.parse(response);

  let loop_bool = true;
  while(loop_bool){
    for(let i=0; i<responseJson["data"].length; i++){
      let lookupCustomField = false; //SlackLinkが入っているカスタムフィールドが見つかるまでfalse
      let responseData = responseJson["data"][i];
      let custom_fields_list = responseData["custom_fields"];
      for(let j=0; j<custom_fields_list.length; j++){
        let slackUrl = "none"; //初期値
        let custom_fields_dict = custom_fields_list[j];
        let custom_fields_name = custom_fields_dict["name"];
        if ( custom_fields_name == "slack_url"){
          slackUrl = custom_fields_dict["text_value"]; //SlackUrlに格納されている値を取得
          if ( /^https:\/\/.*slack\.com\/archives\/.*/.test(slackUrl) ) { //有効なSlackLinkのときのみ動かす
            //返却する値を代入
            //対象のタスクがサブタスクかどうかで処理をわける
            let parentGid = null; //サブタスクの場合、親タスクのGID
            let hierarchical_num = 0; //サブタスクの場合、階層数
            let projects_gid_list = []; //所属しているプロジェクトのGID
            if ( responseData["parent"] != null ){
              //サブタスクの場合、親タスクのgidと親タスクのProjectのgidを格納する
              parentGid = responseData["parent"]["gid"];
              getRootProjectGidResponse = getRootProjectGid(asanaApiToken, parentGid);
              projects_gid_list = getRootProjectGidResponse["projects_gid_list"];
              hierarchical_num = getRootProjectGidResponse["hierarchical_num"]
            } else {
              //サブタスクではない場合、そのタスクのProjetのgidだけを取得、格納する
              for(let k=0; k<responseData["projects"].length; k++){
                projects_gid_list.push(responseData["projects"][k]["gid"]);
              }
            }
            if ( projects_gid_list.length == 0 ){ //どこのプロジェクトにも所属していない(マイタスクのみ)の場合はうまく扱えないのでスキップする
              continue;
            };
            // if ( projects_gid_list.length == 2 ){ //複数プロジェクトに所属している場合もうまく扱えないのでスキップする
            //   continue;
            // };
            // if ( projects_gid_list[0] != targetProjectId ){ //自身のプロジェクトじゃない場合もうまく扱えないのでスキップする
            //   continue;
            // }
            // console.log(projects_gid_list)

            if ( 2 <= hierarchical_num ){ //階層数が2階層以上のもの(サブタスクのサブタスク)はうまく扱えないのでスキップする
              continue;
            };
            return_dict["existSavedItem"][slackUrl] = { //SavedItemsにあるもの一覧
              "subject": responseData["name"],
              "completed": responseData["completed"],
              "gid": responseData["gid"],
              "slackUrl": slackUrl,
              "projects_gid_list": projects_gid_list,
              "due_on": responseData["due_on"],
              "parent_gid" : parentGid,
              "hierarchical_num": hierarchical_num
            }
            lookupCustomField = true;
            continue
          }
        }
      }
      if ( lookupCustomField == false ){
        //野良タスクを登録
        gid = responseData["gid"];
        //対象のタスクがサブタスクかどうかで処理をわける
        let parentGid = null; //サブタスクの場合、親タスクのGID
        let hierarchical_num = 0; //サブタスクの場合、階層数
        let projects_gid_list = []; //所属しているプロジェクトのGID
        if ( responseData["parent"] != null ){
          //サブタスクの場合、親タスクのgidと親タスクのProjectのgidを格納する
          parentGid = responseData["parent"]["gid"];
          getRootProjectGidResponse = getRootProjectGid(asanaApiToken, parentGid);
          projects_gid_list = getRootProjectGidResponse["projects_gid_list"];
          hierarchical_num = getRootProjectGidResponse["hierarchical_num"]
        } else {
          //サブタスクではない場合、そのタスクのProjetのgidだけを取得、格納する
          for(let k=0; k<responseData["projects"].length; k++){
            projects_gid_list.push(responseData["projects"][k]["gid"]);
          }
        }
        if ( 2 <= hierarchical_num ){ //階層数が2階層以上のもの(サブタスクのサブタスク)はうまく扱えないのでスキップする
          continue;
        };
        if ( projects_gid_list.length == 0 ){ //どこのプロジェクトにも所属していない(マイタスクのみ)の場合はうまく扱えないのでスキップする
          continue;
        };
        return_dict["notExistSavedItem"][gid] = {
          "subject": responseData["name"],
          "completed": responseData["completed"],
          "gid": responseData["gid"],
          "permalinkUrl": getDetailTask(asanaApiToken, gid),
          "projects_gid_list": projects_gid_list,
          "due_on": responseData["due_on"],
          "parent_gid" : parentGid,
          "hierarchical_num": hierarchical_num
        }
      }
    }
    //次ページが無い場合(ユーザーがAsanaに居ない場合)はloop_boolにtrueを入れる
    if (responseJson["next_page"] === null){
      loop_bool = false;
    } else {
      //次ページがある場合は再度クエリを投げて再ループ
      let endpoint_url_2 = endpoint_url + "&offset=" + responseJson["next_page"]["offset"];
      response = UrlFetchApp.fetch(endpoint_url_2, options);
      responseJson = JSON.parse(response);
    };
  }

  //結果を返却
  return return_dict;
  
}