export const CompanyId = 5;
export let ClientId = 1905;
export let ClientContractId = 303;
export const teamId = 0;

export const RejectCode = 3;
export const ApproveCode = 2;

export function setClientContext(
  clientId: number,
  clientContractId: number,
): void {
  ClientId = clientId;
  ClientContractId = clientContractId;
}
