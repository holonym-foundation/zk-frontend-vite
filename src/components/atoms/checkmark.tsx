export const CheckMark = ({ size }: $TSFixMe) => (
  <p style={{ color: '#2fd87a', padding: '10px', fontSize: `${size || 1}em` }}>
    {'\u2713'}
  </p>
);
export const WithCheckMark = ({ size, children }: $TSFixMe) => (
  <div
    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
  >
    <CheckMark size={size} />
    {children}
  </div>
);
