import {createBrowserRouter} from "react-router-dom";
import Layout from "../Components/layout";
import Dashboard from "../Pages/dashboard";
import AddStock from "../Pages/addstock";
import ViewStock from "../Pages/viewstock";
import Profile from "../Pages/profile";
import WastageReport from "../Pages/wastagerep";
import AIDemand from "../Pages/aidemand";
import OrderStatus from "../Pages/orderstatus";


const router = createBrowserRouter(
    [
        {
            path: "/",
            element: <Layout />,
            children: [
                {
                    path: "/",
                    element: <Dashboard />
                },
                {
                    path: "/add-stock",
                    element: <AddStock />
                },
                {
                    path: "/view-stock",
                    element: <ViewStock />
                },
                {
                    path: "/profile",
                    element: <Profile />
                },
                {
                    path: "/wastage-report",
                    element: <WastageReport />
                },
                {
                    path: "/demand",
                    element: <AIDemand />
                },
                {
                    path: "/orders",
                    element: <OrderStatus />
                }
            ]
        }
    ]
)

export default router;