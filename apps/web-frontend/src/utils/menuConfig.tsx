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
    icon: "https://static.kivo.wiki/images/students/%E7%BE%BD%E5%B7%9D%20%E8%8E%B2%E8%A7%81/%E6%B3%B3%E8%A3%85/Student_Portrait_CH0291_Collection.png",
    element: <Ba />,
  },
  {
    name: "蔚蓝档案（日服）",
    path: "/ba-jp",
    icon: "https://static.kivo.wiki/images/students/%E7%A0%82%E7%8B%BC%20%E7%99%BD%E5%AD%90/%E6%B3%B3%E8%A3%85/avatar.png",
    element: <BaJp />,
  },
  {
    name: "NIKKE:胜利女神（外服）",
    path: "/nikke",
    icon: "https://nikke.win/images/characters/si_c112_00_s.webp",
    element: <Nikke />,
  },
  {
    name: "尘白禁区",
    path: "/snowbreak",
    icon: "https://img2.tapimg.com/moment/etag/FtpNqUhgnT8Y92z_1CRhLaCd_eLg.png",
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
