import sn from "snowflake-sdk";

import { Connection } from "snowflake-sdk";

export const snowFlakeConnection = sn.createConnection({
  host: "UJRHXPH-TZ37871.snowflakecomputing.com",
  database: "ND2",
  schema: "PUBLIC",
  warehouse: "COMPUTE_WH",
  username: "OURUSER2025",
  password: "OurUSER!@#123123123",
  account: "UJRHXPH-TZ37871.snowflakecomputing.com",
}) as Connection;
