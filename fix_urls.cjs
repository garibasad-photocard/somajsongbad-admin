const fs = require('fs');

const BACKEND = 'https://somajsongbad-backend.onrender.com';

const files = [
  'D:/Karim Vai/Somaj Songbad/omh-cms/frontend/src/pages/Articles/ArticleEditor.jsx',
  'D:/Karim Vai/Somaj Songbad/omh-cms/frontend/src/pages/Articles/PhotoStoryEditor.jsx'
];

files.forEach(file => {
  let c = fs.readFileSync(file, 'utf8');

  // Fix: `${BACKEND}${media.url}` → smart URL that handles Cloudinary
  c = c.replace(
    new RegExp('`' + BACKEND.replace(/\./g, '\\.') + '\\$\\{media\\.url\\}`', 'g'),
    'media.url && media.url.startsWith(\'http\') ? media.url : `' + BACKEND + '${media.url}`'
  );

  // Fix: a.coverImage loading  
  c = c.replace(
    new RegExp('a\\.coverImage \\? `' + BACKEND.replace(/\./g, '\\.') + '\\$\\{a\\.coverImage\\}` : \'\'', 'g'),
    'a.coverImage ? (a.coverImage.startsWith(\'http\') ? a.coverImage : `' + BACKEND + '${a.coverImage}`) : \'\''
  );

  // Fix: coverImage save — strip backend URL only if it's a local path
  c = c.replace(
    new RegExp('coverImagePreview\\.replace\\(\'' + BACKEND.replace(/\./g, '\\.') + '\', \'\'\\)', 'g'),
    'coverImagePreview.startsWith(\'' + BACKEND + '\') ? coverImagePreview.replace(\'' + BACKEND + '\', \'\') : coverImagePreview'
  );

  // Fix: duplicate URL
  c = c.replace(
    new RegExp('`' + BACKEND.replace(/\./g, '\\.') + '\\$\\{duplicate\\}`', 'g'),
    'duplicate && duplicate.startsWith(\'http\') ? duplicate : `' + BACKEND + '${duplicate}`'
  );

  fs.writeFileSync(file, c);
  console.log('Fixed:', file.split('/').pop());
});
