import { Token } from "./types";

export const generateActivationHtml = (token: Token) => `
Hello,
<br/>
Welcome to the app!
<br/><br/>
To verify your email, please click the link below.
<br/>
<a target="_blank" href="${process.env.CLIENT_URL}/auth/activate/${token}">${process.env.CLIENT_URL}/auth/activate/${token}</a>
<br/><br/>
Thanks,
<br/>
Admin Team`;
