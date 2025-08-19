import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { Suspense, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { RouterLoading } from "./Loading";
import { menuList } from "@/utils/menuConfig";

const drawerWidth = 220;

interface Props {
  /**
   * Injected by the documentation to work in an iframe.
   * You won't need it on your project.
   */
  window?: () => Window;
  children: React.ReactElement;
}

export default function ResponsiveDrawer(props: Props) {
  const { window, children } = props;
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();
  const loc = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = useMemo(
    () => (
      <div>
        <Toolbar />
        <Divider />
        <List>
          {menuList.map(({ name, path, icon }) => (
            <ListItem key={path} disablePadding>
              <ListItemButton
                className="group"
                onClick={() => {
                  navigate(path);
                }}
              >
                <ListItemIcon className="w-6 h-6 transition ease-in-out delay-100 group-hover:-translate-y-1 group-hover:scale-110 duration-300">
                  <img
                    src={icon}
                    alt={name}
                    className="w-full h-full object-contain rounded-sm"
                  />
                </ListItemIcon>
                <ListItemText primary={name} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </div>
    ),
    []
  );

  const navTitle = useMemo(() => {
    return (
      <Typography variant="h6" noWrap component="div">
        {menuList.find((item) => item.path === loc.pathname)?.name}
      </Typography>
    );
  }, [loc.pathname]);

  const container =
    window !== undefined ? () => window().document.body : undefined;

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
        style={{
          zIndex: 100,
        }}
      >
        <Toolbar className="bg-gradient-to-r from-sky-500 to-indigo-500">
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
            className="hover:animate-bounce"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 16 16"
              fill="none"
            >
              <g clipPath="url(#clip0_11756_122281)">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0.109984 3.18714C0.204881 3.06884 0.348344 3 0.500004 3H13.5C13.6517 3 13.7951 3.06884 13.89 3.18714C13.9849 3.30544 14.021 3.46042 13.9881 3.60847L13.7679 4.59926C15.0529 4.93858 16 6.10853 16 7.5C16 9.15685 14.6569 10.5 13 10.5C12.8184 10.5 12.6403 10.4838 12.4671 10.4527L12.3361 11.0423C12.0819 12.1862 11.0674 13 9.89566 13H4.10435C2.9326 13 1.91807 12.1862 1.66388 11.0423L0.0119109 3.60847C-0.0209887 3.46042 0.0150858 3.30544 0.109984 3.18714ZM12.6844 9.47531C12.787 9.49155 12.8924 9.5 13 9.5C14.1046 9.5 15 8.60457 15 7.5C15 6.58649 14.3873 5.81577 13.5507 5.5767L12.6844 9.47531Z"
                  fill="white"
                />
              </g>
              <defs>
                <clipPath id="clip0_11756_122281">
                  <rect width="16" height="16" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </IconButton>
          {navTitle}
        </Toolbar>
      </AppBar>
      <Box
        className="z-50"
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          paddingTop: 8,
        }}
      >
        <Suspense fallback={<RouterLoading />}>{children}</Suspense>
      </Box>
    </Box>
  );
}
