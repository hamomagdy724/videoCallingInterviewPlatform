// import { Inngest } from "inngest";
// import { connectDB } from "./db.js";
// import User from "../models/User.js";

// // Create a client to send and receive events
// export const inngest = new Inngest({ id: "talent-iq" });

// const syncUser = inngest.createFunction(
//     { id: "sync-user" },
//     { event: "clerk/user.created" },
//     async ({ event }) => {
//         await connectDB()

//         const { id, email_addresses, first_name, last_name, image_url } = event.data;

//         const newUser = {
//             clerkId: id,
//             email: email_addresses[0]?.email_address,
//             name: `${first_name || ""} ${last_name || ""}`,
//             profileImage: image_url,
//         };

//         await User.create(newUser);

//         // todo: do sth
//         await upsertStreamUser({
//             id: newUser.clerkId.toString(),
//             name: newUser.name,
//             image: newUser.profileImage
//         })
//     }
// );

// const deleteUserFromDB = inngest.createFunction(
//     { id: "delete-user-from-db" },
//     { event: "clerk/user.deleted" },
//     async ({ event }) => {
//         await connectDB()

//         const { id } = event.data;
//         await User.deleteOne({ clerkId: id });

//         // todo: do sth
//         await deleteStreamUser(id.toString());
//     }
// );

// export const functions = [syncUser, deleteUserFromDB];


import { Inngest } from "inngest";
import { connectDB } from "./db.js";
import User from "../models/User.js";
// FIX 1: We must import the Stream functions so they don't cause a ReferenceError!
import { upsertStreamUser, deleteStreamUser } from "./stream.js";

export const inngest = new Inngest({ id: "talent-iq" });

const syncUser = inngest.createFunction(
    { id: "sync-user" },
    { event: "clerk/user.created" },
    // FIX 2: We must extract 'step' from the Inngest payload
    async ({ event, step }) => {

        // FIX 3: Wrap the MongoDB logic cleanly in a step.run block
        const savedUser = await step.run("save-user-to-db", async () => {
            const { id, email_addresses, first_name, last_name, image_url } = event.data;

            const newUser = {
                clerkId: id,
                email: email_addresses[0]?.email_address,
                name: `${first_name || ""} ${last_name || ""}`.trim(),
                profileImage: image_url || "",
            };

            // This creates the user in MongoDB and returns the document to Inngest
            return await User.create(newUser);
        });

        // FIX 4: Wrap the Stream logic in its own step
        await step.run("sync-to-stream", async () => {
            await upsertStreamUser({
                id: savedUser.clerkId.toString(),
                name: savedUser.name,
                image: savedUser.profileImage
            });
        });

        // FIX 5: Tell Inngest the job is 100% complete
        return { success: true, user: savedUser };
    }
);

const deleteUserFromDB = inngest.createFunction(
    { id: "delete-user-from-db" },
    { event: "clerk/user.deleted" },
    async ({ event, step }) => {

        await step.run("delete-from-mongodb", async () => {
            const { id } = event.data;
            await User.deleteOne({ clerkId: id });
        });

        await step.run("delete-from-stream", async () => {
            const { id } = event.data;
            await deleteStreamUser(id.toString());
        });

        return { success: true };
    }
);

export const functions = [syncUser, deleteUserFromDB];