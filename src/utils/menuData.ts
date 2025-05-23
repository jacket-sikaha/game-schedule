import { lazy } from "react";

// 懒加载组件 要配合Suspense使用，避免白屏问题
// fast fresh问题 懒加载的组件里不能额外再导出别的东西
// export const Genshin2 = lazy(() => import("../pages/Genshin"));

export const Genshin = lazy(() => import("@/pages/Genshin"));
export const StarRail = lazy(() => import("@/pages/StarRail"));
export const FGO = lazy(() => import("@/pages/FGO"));
export const Arknights = lazy(() => import("@/pages/Arknights"));
export const WutheringWaves = lazy(() => import("@/pages/wuthering-waves"));
export const Pns = lazy(() => import("@/pages/Pns"));
export const Ba = lazy(() => import("@/pages/ba"));
export const Nikke = lazy(() => import("@/pages/nikke"));
export const BaJp = lazy(() => import("@/pages/ba-jp"));
