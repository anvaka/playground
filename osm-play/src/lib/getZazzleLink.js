import request from './request';

const imgurClientId = '8dcb8da0d86146b';
const imgurUrl = 'https://api.imgur.com/3/image';

const productKinds = {
  mug: '168739066664861503'
};

function getZazzleLink(kind, imageUrl) {
  const productCode = productKinds[kind];
  if (!productCode) {
    throw new Error('Unknown product kind: ' + kind);
  }

  const imageEncoded = encodeURIComponent(imageUrl);
  return `https://www.zazzle.com/api/create/at-238058511445368984?rf=238058511445368984&ax=Linkover&pd=${productCode}&ed=true&tc=&ic=&t_map_iid=${imageEncoded}`;
}

export default function generateZazzleLink(canvas) {
  var imageContent = canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, '');
  const form = new FormData();
  form.append('image', imageContent);

  return request(imgurUrl, {
    method: 'POST',
    responseType: 'json',
    progress,
    headers: {
      Authorization: `Client-ID ${imgurClientId}`
    },
    body: form,
  }, 'POST').then(x => {
    if (!x.success) throw new Error('Failed to upload image');
    let link = x.data.link;
    return getZazzleLink('mug', link);
  }).catch(e => {
    console.log('error', e);
    throw e;
  });

  function progress() {
    console.log(arguments);
  }
}