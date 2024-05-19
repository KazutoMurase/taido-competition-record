import React, { useEffect } from "react";

// TODO:
// ブロックごとの全イベントはDBのどこから取れるのか？
// ブロックごとのイベント完了/未完了はDBに入っているのか？
// 各イベントの進行状況（全試合数：終了済試合数）はどこから取れるか？
// →とりあえず各ブロックテキストベースで表示
// 見やすい表示の仕方はどうするか

// const GetCurrentEvent: React.FC<{blockName: string}> = ({blockName}) => {
//   const fetchEventData = async () => {
//    fetch("/api/get_result?event_name=" )
//   }
//   useEffect(() => {

//   })
// }

import ProgressOnBlock from "../../components/progress_on_block";

const ProgressCheck: React.FC = () => {
  return (
    <>
      <div>
        <ProgressOnBlock
          block_number="x"
          update_interval={1000}
          return_url="/test"
        />
      </div>
      <div>
        <ProgressOnBlock
          block_number="y"
          update_interval={1000}
          return_url="/test"
        />
      </div>
    </>
  );
};

export default ProgressCheck;
