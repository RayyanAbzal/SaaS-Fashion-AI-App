declare module 'isomorphic-dompurify' {
  const DOMPurify: {
    sanitize(input: string, config?: any): string;
  };
  export default DOMPurify;
}
