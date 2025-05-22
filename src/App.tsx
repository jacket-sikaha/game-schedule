import "./App.css";
import { Route, Routes } from "react-router-dom";
import Layout from "@/components/Layout";
import { menuList } from "@/utils/menuData";
import NotFound from "@/components/NotFound";
import { useEffect } from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

function App() {
  useEffect(() => {
    console.log("采用GitHub action，push后自动部署到cloudfare page");
  }, []);

  return (
    <>
      <Layout>
        <Routes>
          {/* <Route path="/" element={<Home />} index /> */}
          {menuList.map(({ path, element }, i) => {
            return (
              <Route key={path} path={path} element={element} index={i === 0} />
            );
          })}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </>
  );
}

export default App;
