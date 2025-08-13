import axios from "axios";
import { useState } from "react";
import { useQuery } from "react-query";
import EventCalendar from "@/components/EventCalendar";
import dayjs from "dayjs";
import { CalendarActivity } from "@/components/EventCalendar/CalendarType";
import Loading from "@/components/Loading";
import { BACKEND_URL } from "@/services/note";

const ignored_ann_ids = [
  194, // 有奖问卷调查开启！
  183, // 官方社群一览
  171, // 米游社《崩坏：星穹铁道》专属工具一览
  187, // 《崩坏：星穹铁道》防沉迷系统公告
  185, // 《崩坏：星穹铁道》公平运营声明
  203, // 社媒聚合页上线
  505, // 购买「无名客的奖章」赠送「42日畅玩卡」说明
];

const IGNORE_WORDS = [
  "内容专题页",
  "版本更新说明",
  "调研",
  "防沉迷",
  "米游社",
  "专项意见",
  "游戏优化及已知问题说明",
  "问卷调查",
  "版本更新通知",
  "更新时间说明",
  "预下载功能",
  "周边限时",
  "周边上新",
  "角色演示",
  "上新",
  "同行任务",
  "无名勋礼",
  "工具更新",
  "激励计划",
  "攻略征集",
  "更新概览",
  "有奖问卷",
];

function StarRail() {
  const [eventData, setEventData] = useState<CalendarActivity[]>();
  const { isFetching } = useQuery({
    queryKey: ["starrail"],
    queryFn: () => axios(`${BACKEND_URL}/starrail`),
    onSuccess(data: any) {
      setEventData(
        data?.data?.list
          ?.filter((item: any) => {
            return (
              !ignored_ann_ids.includes(item.ann_id) &&
              IGNORE_WORDS.every((word) => item.title.indexOf(word) === -1)
            );
          })
          .map((item: any) => {
            return {
              ...item,
              id: item?.id || item?.ann_id,
            };
          })
      );
    },
  });
  // 检验日历组件
  return (
    <>
      {isFetching ? (
        <Loading />
      ) : (
        <EventCalendar
          {...{
            value: dayjs(),
            activity: eventData ?? [],
          }}
        />
      )}
    </>
  );
}

export default StarRail;
