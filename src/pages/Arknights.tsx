import axios from "axios";
import { useState } from "react";
import { useQuery } from "react-query";
import EventCalendar from "@/components/EventCalendar";
import dayjs from "dayjs";
import { CalendarActivity } from "@/components/EventCalendar/CalendarType";
import Loading from "@/components/Loading";
import { BACKEND_URL } from "@/services/note";

function Arknights() {
  const [eventData, setEventData] = useState<CalendarActivity[]>();
  const { isFetching } = useQuery({
    queryKey: ["Arknights"],
    queryFn: () => axios(`${BACKEND_URL}/ak`),
    onSuccess(data: any) {
      setEventData(
        data?.data?.data?.filter((item: CalendarActivity) => {
          return Boolean(item.start_time);
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

export default Arknights;
