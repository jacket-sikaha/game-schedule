import EventCalendar from "@/components/EventCalendar";
import { CalendarActivity } from "@/components/EventCalendar/CalendarType";
import Loading from "@/components/Loading";
import { BACKEND_URL } from "@/services/note";
import axios from "axios";
import dayjs from "dayjs";
import { useState } from "react";
import { useQuery } from "react-query";

function Nikke() {
  const [eventData, setEventData] = useState<CalendarActivity[]>();
  const { isFetching } = useQuery({
    queryKey: ["nikke"],
    queryFn: () => axios(`${BACKEND_URL}/nikke`),
    onSuccess(data: any) {
      setEventData(
        data?.data?.data
          ?.filter((item: CalendarActivity) => {
            return Boolean(item.start_time);
          })
          。map((item: CalendarActivity) => ({
            ...item,
            banner: item.banner?.replace(
              "cdnimg-v2.gamekee.com",
              "sikara.soappig.cn:10443/gamekee"
            ),
          }))
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

export default Nikke;
