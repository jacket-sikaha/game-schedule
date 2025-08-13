import { useQuery } from "react-query";
import EventCalendar from "@/components/EventCalendar";
import dayjs from "dayjs";
import axios from "axios";
import Loading from "@/components/Loading";
import { useState } from "react";
import { CalendarActivity } from "@/components/EventCalendar/CalendarType";
import { BACKEND_URL } from "@/services/note";

function Pcr() {
  const [eventData, setEventData] = useState<CalendarActivity[]>();
  const { isFetching } = useQuery({
    queryKey: ["pcr"],
    queryFn: () => axios(`${BACKEND_URL}/pcr`),
    onSuccess(data: { data: any[] }) {
      setEventData(
        data?.data?.map((item: any) => ({
          ...item,
          start_time: item.startTime,
          end_time: item.endTime,
        }))
      );
    },
  });
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

export default Pcr;
