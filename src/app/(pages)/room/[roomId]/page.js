
// import ChatRoom from '@/app/_components/chat/page'
// import React from 'react'


// const Page = ({params}) => {

    
    
//   return (
//     <ChatRoom roomId={params.roomId} />
//   )
// }

// export default Page


"use client"; // Mark this as a client component

import ChatRoom from "@/app/_components/chat/page"; // Ensure correct import path
import React from "react";
import { useParams } from "next/navigation"; // Fetch dynamic params on the client side

const Page = () => {
    const params = useParams(); // Get the dynamic route params
    const roomId = params?.roomId || ""; // Ensure roomId is valid

    return <ChatRoom roomId={roomId} />;
};

export default Page;
