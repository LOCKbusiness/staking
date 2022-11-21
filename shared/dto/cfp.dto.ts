export interface CfpDto {
  name: string;
  votes: { accountIndex: number; address: string; message: string }[];
}
