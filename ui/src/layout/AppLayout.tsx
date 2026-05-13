import React from "react";
import TopBar from "../components/topbar/topBar";
import { Screen } from "../types/screen";

type Props = {
    screen: Screen;
    setScreen: (value: Screen) => void;
    search: string;
    setSearch: (value: string) => void;
    children: React.ReactNode;
};

export default function AppLayout({
    screen,
    setScreen,
    search,
    setSearch,
    children,
}: Props) {
    return (
        <div
            style={{
                minHeight: "100vh",
                background: "linear-gradient(180deg, #081120, #030814)",
                color: "white",
            }}
        >
            <TopBar
                screen={screen}
                setScreen={setScreen}
                search={search}
                setSearch={setSearch}
            />

            {children}
        </div>
    );
}