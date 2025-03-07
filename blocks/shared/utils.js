import { DA_ORIGIN } from './constants.js';

let imsLoaded;

export const daFetch = async (url, opts = {}) => {
  if (!imsLoaded) {
    const { getLibs } = await import('../../scripts/utils.js');
    const { loadIms } = await import(`${getLibs()}/utils/utils.js`);
    try {
      await loadIms();
      imsLoaded = true;
    } catch {
      /* die silently */
    }
  }

  const accessToken = window.adobeIMS?.getAccessToken();
  opts.headers = opts.headers || {};
  if (accessToken) {
    // opts.credentials = "include";
    opts.headers.Authorization = `Bearer ${accessToken.token}`;
  }
  const resp = await fetch(url, opts);
  if (resp.status === 401) {
    const main = document.body.querySelector('main');
    main.innerHTML = 'Are you lost?';
  }
  return resp;
};

async function aemPreview(path, api) {
  const [owner, repo, ...parts] = path.slice(1).split('/');
  const name = parts.pop() || repo || owner;
  parts.push(name.replace('.html', ''));
  const aemUrl = `https://admin.hlx.page/${api}/${owner}/${repo}/main/${parts.join('/')}`;
  const resp = await fetch(aemUrl, { method: 'POST' });
  if (!resp.ok) return;
  return resp.json();
}

export async function saveToDa({ path, formData, blob, props, preview = false }) {
  const opts = { method: 'PUT' };

  const form = formData || new FormData();
  if (blob || props) {
    if (blob) form.append('data', blob);
    if (props) form.append('props', JSON.stringify(props));
  }
  if ([...form.keys()].length) opts.body = form;

  const daResp = await daFetch(`${DA_ORIGIN}/source${path}`, opts);
  if (!daResp.ok) return;
  if (!preview) return;
  return aemPreview(path, 'preview');
}
