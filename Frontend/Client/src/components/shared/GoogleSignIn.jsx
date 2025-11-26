import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { axiosInstance } from "@/lib/axios-instance"


export function CreateRoomModal({isOpen,onClose}) {
  const navigate =useNavigate()
    
    const [name ,setName] = useState("")
    const handleNameChange = (event) =>{
        const{value} =event.target
        setName(value);
    };

    const handleSubmit = async () =>{
        try{
            const url ="/Room";
            const response = await axiosInstance.post(url, {name});
            if(response.status === 201){
                const roomId = response.data.roomId;
                onClose();
                navigate({
                    to: "/room/$id",
                    params: { id: roomId }
                });
            }
        }
        catch(err){
            alert('Failed to create room. Please try again.');
        }
    };
  
    return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <form>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Room</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="name-1">Name</Label>
              <Input 
              id="name-1" 
              value={name}
              onChange={handleNameChange}
              placeholder="Enter Room Name"  
              name="name" />
            </div>
            
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}
