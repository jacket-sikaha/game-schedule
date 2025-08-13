// import EventCalendar from "@/components/EventCalendar";
import dayjs from "dayjs";
import { useState } from "react";
import { useQuery } from "react-query";
import { CalendarActivity } from "@/components/EventCalendar/CalendarType";
import Loading from "@/components/Loading";
import axios from "axios";
import { BACKEND_URL } from "@/services/note";
import EventCalendar from "@/components/EventCalendar";

const ignored_ann_ids = [
  495, // 有奖问卷调查开启！
  1263, // 米游社《原神》专属工具一览
  423, // 《原神》玩家社区一览
  422, // 《原神》防沉迷系统说明
  762, // 《原神》公平运营声明
  20835, // 冒险助力礼包
];

const IGNORE_WORDS = [
  "修复",
  "内容专题页",
  "米游社",
  "调研",
  "防沉迷",
  "问卷",
  "公平运营",
  "纪行",
  "有奖活动",
  "反馈功能",
];

function Genshin() {
  const [eventData, setEventData] = useState<CalendarActivity[]>();
  const { isFetching } = useQuery({
    queryKey: ["genshin"],
    queryFn: () => axios(`${BACKEND_URL}/genshin`),
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

export default Genshin;
