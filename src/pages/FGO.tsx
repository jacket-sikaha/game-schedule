import axios from "axios";
import { useState } from "react";
import { useQuery } from "react-query";
import EventCalendar from "@/components/EventCalendar";
import dayjs from "dayjs";
import { CalendarActivity } from "@/components/EventCalendar/CalendarType";
import Loading from "@/components/Loading";
import { BACKEND_URL } from "@/services/note";

function FGO() {
  const [eventData, setEventData] = useState<CalendarActivity[]>();
  const { isFetching } = useQuery({
    queryKey: ["fgo"],
    queryFn: () => axios(`${BACKEND_URL}/fgo`),
    onSuccess(data: any) {
      setEventData(
        data?.data?.data
          ?.filter((item: CalendarActivity) => {
            return Boolean(item.start_time);
          })
          .map((item: CalendarActivity) => {
            // // 带中文的日期格式dayjs都不能直接识别
            // item.start_time = dayjs(
            //   item.start_time,
            //   "YYYY M D",
            //   "zh-cn"
            // ).format("YYYY-MM-DD");
            // item.end_time = dayjs(item.end_time, "YYYY M D", "zh-cn").format(
            //   "YYYY-MM-DD"
            // );
            item.range = item.content ?? undefined;
            return item;
          })
      );
    },
  });
  // 检验日历组件
  // console.log("eventData", eventData);
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

export default FGO;
