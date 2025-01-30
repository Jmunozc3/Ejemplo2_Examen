import { ObjectId } from "mongodb";
import { GraphQLError } from "graphql";
import { ContactMode, type PhoneApi } from "./types.ts";
import { Collection } from "mongodb";

type getid={
    id:string;
}

type update={
    id:string,
    name?:string,
    phone?:string,
}

type addcontact={
    name:string,
    phone:string,
    friends:string[],
}

type Context={
    ContactCollection:Collection<ContactMode>
}

export const resolvers={

    Contact:{
        id:(parent:ContactMode):string =>{
            return parent._id?.toString();
        },

        friends:async(_:unknown,parent:ContactMode,ctx:Context)=>{
            if (!Array.isArray(parent.friends)) {
                return [];
            }
            const ids = parent.friends.map((id) => new ObjectId(id));
            return await ctx.ContactCollection.find({ _id: { $in: ids } }).toArray();
        }
    },

    Query:{
        getContacts:async (_:unknown,__:unknown,ctx:Context):Promise<ContactMode[]> =>{
            const con=await ctx.ContactCollection.find().toArray();
            return con;
        },
        getContact:async (_:unknown,args:getid,ctx:Context):Promise<ContactMode |null>=>{
            const con=await ctx.ContactCollection.findOne({_id:new ObjectId(args.id)});
            return con;
        }
    },

    Mutation:{
        deleteContact:async(_:unknown,args:getid,ctx:Context):Promise<boolean> =>{
            const {deletedCount} =await ctx.ContactCollection.deleteOne({_id:new ObjectId(args.id)});
            return deletedCount===1;
        },

        addContact:async(_:unknown,args:addcontact,ctx:Context):Promise<ContactMode> =>{
            const APY_KEY = Deno.env.get("APY_KEY");

            if (!APY_KEY) {
            console.error("APY_KEY is not set");
           Deno.exit(1);
            }

            const {name,phone,friends} =args;

            const exist= await ctx.ContactCollection.findOne({phone});
            if(exist) throw new GraphQLError("TELEFONO EXISTE");

            const friendexist= friends.map((f)=>{
                if(!ObjectId.isValid(f))throw new GraphQLError("ERROR");
                return new ObjectId(f);
            })

            const url=`https://api.api-ninjas.com/v1/validatephone?number=${phone}`;

            const data = await fetch(url,{headers:{"x-api-key":APY_KEY}})

            const response:PhoneApi = await data.json();

            if(!response.is_valid)throw new GraphQLError("ERROR");

            const add= await ctx.ContactCollection.insertOne({
                name,
                phone,
                friends:friendexist,
                country:response.country,
            })

            return{
                _id:add.insertedId,
                name,
                phone,
                friends:friendexist,
                country:response.country,
            }
            
        },

        updateContact:async(_:unknown,args:update,ctx:Context):Promise<ContactMode|null>=>{
            const APY_KEY = Deno.env.get("APY_KEY");

            if (!APY_KEY) {
            console.error("APY_KEY is not set");
           Deno.exit(1);
            }

            const{id,name,phone} =args;

            const update:Partial<ContactMode>={};

            if(name!==undefined) update.name=name;
            if(phone!==undefined){
                update.phone=phone;

                const url=`https://api.api-ninjas.com/v1/validatephone?number=${phone}`;
                const data = await fetch(url,{headers:{"x-api-key":APY_KEY}})
                const response:PhoneApi = await data.json();
                if(!response.is_valid)throw new GraphQLError("ERROR");

                update.country=response.country;
            } 

            const up=await ctx.ContactCollection.updateOne({_id:new ObjectId(id)},{$set:update})
            if(up.modifiedCount!==1)throw new GraphQLError("ERROR");

            const con=await ctx.ContactCollection.findOne({_id:new ObjectId(id)});
            return con;

        }


    }

};