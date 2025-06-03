import Pcr from "@/pages/Pcr";
import {
  Arknights,
  Ba,
  BaJp,
  FGO,
  Genshin,
  Nikke,
  Pns,
  SnowBreak,
  StarRail,
  WutheringWaves,
} from "./menuData";

export const menuList: menuItem[] = [
  {
    name: "公主连结",
    path: "/pcr",
    icon: "https://pcredivewiki.tw/static/images/unit/icon_unit_117131.png",
    element: <Pcr />,
  },
  {
    name: "原神",
    path: "/",
    icon: "https://img-static.mihoyo.com/communityweb/upload/14792b4820e324d9e9ef2bbea406f4ae.png",
    element: <Genshin />,
  },
  {
    name: "星穹铁道",
    path: "/starrail",
    icon: "https://upload-bbs.mihoyo.com/upload/2022/04/28/dc4106543564d1a372b47f5a3cf15958_994599019851288826.png?x-oss-process=image/resize,s_150/quality,q_80/auto-orient,0/interlace,1/format,jpg",
    element: <StarRail />,
  },
  {
    name: "FGO",
    path: "/fgo",
    icon: "https://media.fgo.wiki/thumb/d/da/%E5%9F%83%E5%88%97%E4%BB%80%E5%9F%BA%E4%BC%BD%E5%8B%92%28Beast%29_status_1.png/225px-%E5%9F%83%E5%88%97%E4%BB%80%E5%9F%BA%E4%BC%BD%E5%8B%92%28Beast%29_status_1.png",
    element: <FGO />,
  },
  {
    name: "明日方舟",
    path: "/arknights",
    icon: "https://media.prts.wiki/6/66/%E5%A4%B4%E5%83%8F_%E7%BB%B4%E4%BB%80%E6%88%B4%E5%B0%94.png",
    // icon: "https://prts.wiki/images/3/3a/%E5%A4%B4%E5%83%8F_%E7%BC%AA%E5%B0%94%E8%B5%9B%E6%80%9D.png",
    element: <Arknights />,
  },
  {
    name: "鸣潮",
    path: "/mc",
    icon: "https://prod-alicdn-community.kurobbs.com/postBanner/1721276570014265525.png",
    element: <WutheringWaves />,
  },
  {
    name: "战双帕弥什",
    path: "/pns",
    icon: "https://prod-alicdn-community.kurobbs.com/forum/243f9583d24142bba43633972763294120240505.png",
    element: <Pns />,
  },
  {
    name: "蔚蓝档案（国服）",
    path: "/ba",
    icon: "https://cdnimg-v2.gamekee.com/wiki2.0/images/w_282/h_282/829/43637/2023/1/24/949300.png",
    element: <Ba />,
  },
  {
    name: "蔚蓝档案（日服）",
    path: "/ba-jp",
    icon: "https://cdnimg-v2.gamekee.com/wiki2.0/images/w_252/h_204/829/191981/2024/10/8/971717.png",
    element: <BaJp />,
  },
  {
    name: "NIKKE:胜利女神（外服）",
    path: "/nikke",
    icon: "https://cdnimg-v2.gamekee.com/wiki2.0/images/w_128/h_128/1253/475341/2025/0/10/769776.webp",
    element: <Nikke />,
  },
  {
    name: "尘白禁区",
    path: "/snowbreak",
    icon: "https://cdnimg-v2.gamekee.com/wiki2.0/images/w_425/h_550/1220/157597/2024/11/12/962297.png?x-image-process=image/resize,m_lfit,h_300,w_300/ignore-error,1&image_process=resize,mid,w_300,h_300",
    element: <SnowBreak />,
  },

  // {
  //   name: "xxxx",
  //   path: "/xxx",
  //   icon: "https://starrailstation.com/assets/9dcc998c64c6aedefa5d9507a356bcfa4230077449edba27a6581f4d009c113a.webp",
  //   element: <Loading /> || (
  //     <Suspense fallback={<Loading />}>
  //       <Genshin2 />
  //     </Suspense>
  //   ),
  // },
];
