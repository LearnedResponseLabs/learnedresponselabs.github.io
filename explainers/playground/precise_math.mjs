// Rounded binary64 elementary functions for cancellation-sensitive calculations.
// Fixed-point Taylor and atanh sums use 200 bits; the supported angles are bounded.
// No reference data or platform service is used.
const bits=200n,scale=1n<<bits,buf=new DataView(new ArrayBuffer(8));
function fromFloat(x){buf.setFloat64(0,x);const b=buf.getBigUint64(0),e=Number((b>>52n)&2047n)-1023-52,s=(b>>63n)?-1n:1n,m=(b&((1n<<52n)-1n))+(1n<<52n),shift=BigInt(e)+bits;return s*(shift>=0n?m<<shift:m>>-shift);}
const toFloat=x=>Number(x)/Number(scale);
function sinFixed(x){let term=x,total=x;for(let j=1n;j<60n;j++){term=-term*x*x/(scale*scale*((2n*j)*(2n*j+1n)));if(term===0n)break;total+=term;}return total;}
function atanhFixed(z){let pow=z,total=z,z2=z*z/scale;for(let j=3n;j<600n;j+=2n){pow=pow*z2/scale;const term=pow/j;if(term===0n)break;total+=term;}return 2n*total;}
const ln2=atanhFixed(scale/3n);
export const mirrorSin=x=>Number.isFinite(x)&&Math.abs(x)<=8?toFloat(sinFixed(fromFloat(x))):Math.sin(x);
export function mirrorCos(x){if(!Number.isFinite(x)||Math.abs(x)>8)return Math.cos(x);const a=fromFloat(x);let term=scale,total=scale;for(let j=1n;j<60n;j++){term=-term*a*a/(scale*scale*((2n*j-1n)*(2n*j)));if(term===0n)break;total+=term;}return toFloat(total);}
export function mirrorLog(x){if(!(x>Math.pow(2,-100))||x>Math.pow(2,100)||!Number.isFinite(x))return Math.log(x);let y=fromFloat(x),k=0n;while(y<scale){y*=2n;k--;}while(y>=2n*scale){y/=2n;k++;}return toFloat(atanhFixed((y-scale)*scale/(y+scale))+k*ln2);}
export const mirrorLogSin=x=>0<x&&x<Math.PI?mirrorLog(mirrorSin(x)):Math.log(Math.sin(x));
