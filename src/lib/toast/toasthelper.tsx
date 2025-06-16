import toast from 'react-hot-toast'
import { AiOutlineCheckCircle } from 'react-icons/ai';
export const notifySuccess=(message:string, icon?: String)=>{
    toast.success(`${message} ${!!icon && icon }`)
}
export const notifyError=(message:string)=>{
    toast.custom(<AiOutlineCheckCircle size={24}/>)

toast.error(message)
}