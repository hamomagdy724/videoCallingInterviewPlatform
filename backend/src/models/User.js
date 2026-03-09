import mongoose from 'mongoose';
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        profileImage: {
            type: String,
            default: "",
        },
        clerkId: {
            type: String,
            required: true,
            unique: true,
        }, // reference for database
    },
    { timestamps: true } // createdAt, updatedAt (optional)
);
const User = mongoose.model('User', userSchema);
export default User; // for use in other parts of the application