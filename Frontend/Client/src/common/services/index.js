import { axiosInstance } from "@/lib/axios-instance.js"

const url="/Room"

//createRoom function
export const createRoom = async (roomData) => {
    try {
        const response = await axiosInstance.post(url, roomData);
        return response.data;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

export const getAllRooms = async () =>{
    try{
        const {status ,data} = await axiosInstance.get(url);

    if(status ===200){
        return data;
    }
 }catch(err){
    console.log(err);
    return [];

    }
};

export const getRoomById =async (id) =>{
    try{
        const {data} = await axiosInstance.get(url + "/" + id);
        return data;
 
    }catch(err){
        console.log(err);
        return {}
    }
}
