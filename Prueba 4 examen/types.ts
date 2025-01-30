import { OptionalId,ObjectId} from "mongodb";

export type Contact={
    id:string;
    name:string;
    phone:string;
    country:string;
    friends:string[];
}

export type ContactMode= OptionalId<{
    name:string;
    phone:string;
    country:string;
    friends:ObjectId[];
}>

export type PhoneApi={
    is_valid:boolean;
    country:string;
}