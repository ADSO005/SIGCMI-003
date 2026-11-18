import { randomInt } from "node:crypto";

const generateOTP = () => {
    return randomInt(100_000, 1_000_000).toString();
};

export default generateOTP;
