import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const targetDir = path.resolve("stitch_screens");
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const screens = [
  {
    index: 1,
    id: "583005411b454c5ca2206c4c70fcfa00",
    name: "inbox_light_blue",
    title: "VxMail — Inbox (Light Blue)",
    imageUrl: "https://lh3.googleusercontent.com/aida/AEtjO1WAHe3G7lOXAWPYevCPHwPR4B1hU-eQyyvFTnYl8bA_JdFRZ3_Owju2XxwoIvLFL4G3bzBzRo7pBmpE04FqbQu46SPef1dwDeeLXRBaOKrNGoqUc6iZh7_8WzLUcLMrjzwkysj4dyowkL-vGgy0zmJxAU9JEjXwFbI_Uhs4w8scBlrzygJOi3-wxkEsXi43tNFPdCwVFhDRNkycjG8UUAqpfN1PnefDhqvRjlXRjXmsUJXoPXXaJ3N62w",
    codeUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1YzU5NjBlZDU4ODIwMjA3YTkxNTI0MTFiODAxEgsSBxCvroWc0BUYAZIBIwoKcHJvamVjdF9pZBIVQhM2NDQwNDMzODg3MDc2MDAzNDQ3&filename=&opi=89354086",
  },
  {
    index: 2,
    id: "a12c477203ec4b759d6d1dae642547bc",
    name: "email_thread_light_blue",
    title: "VxMail — Email Thread (Light Blue)",
    imageUrl: "https://lh3.googleusercontent.com/aida/AEtjO1VGC4HQlFyWKIq6EnSmuJWgX--McutY3SQIOVbzFY7Xxq_A3HN6CvUzurzDverlFliznOZoUapVuJMbHKrDQ97U_1tlOptyUmC4xTmDYtgpno9Zl8Nq64-Q5g0Mvfalbm8_uCReklp7u5JOxY4alA0_JTRsjJ3HVj_JnaEGIdUqM5X9P9b2TBpjWQWPb0v58pvc_IXzhL8cj_p_kUmIr6YjtmE5F6sGuuNW3PPkvcIf3AfeyKbVHzLOzzg",
    codeUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1YzU5NjEzYjA2YTkwMjA3OWEzMjIzMTM2Njk1EgsSBxCvroWc0BUYAZIBIwoKcHJvamVjdF9pZBIVQhM2NDQwNDMzODg3MDc2MDAzNDQ3&filename=&opi=89354086",
  },
  {
    index: 3,
    id: "d11bb7002ce340fbab083924bc26c43b",
    name: "compose_light_blue",
    title: "VxMail — Compose (Light Blue)",
    imageUrl: "https://lh3.googleusercontent.com/aida/AEtjO1Wq8m_sidnRhKlphZcUxw5pkFD7kMlFEzrAwJQfQpCxG9QkR4ds5GZq2pAGGCaqlBUMu2x1QLwrAsp_1XGyFSBktVGFWvSjGRDzjuGcnjB4B1gzYdyvTblWaLdBB7V2xgmKiabOMFz7t_DOqhIbq5In-NFhgiUmPSe_ZJ8Mt7e8enr_qot0L6UqOc9qtN7cbtPA_qwzV0cnl_odTegs0jK71JS1pxKyFISUftMSTYgddUvGzKdgvSopgvo",
    codeUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1YzU5NjBiZmM1YWYwODlhZjcyYWVlMDc3ZTA3EgsSBxCvroWc0BUYAZIBIwoKcHJvamVjdF9pZBIVQhM2NDQwNDMzODg3MDc2MDAzNDQ3&filename=&opi=89354086",
  },
  {
    index: 4,
    id: "9274f9cacfb94014934cc9a82a8c8edd",
    name: "search_light_blue",
    title: "VxMail — Search (Light Blue)",
    imageUrl: "https://lh3.googleusercontent.com/aida/AEtjO1V4BXoeZsGpsZFdicVDTXy8OjWWAlZM7i9dqOx-Y26wLng9pxlDci8WAOF1pwZJIlRpr_tUSlQasniGh6kvDka2uuN4GdZj5NM9U0CG1IRQwmCnNa9Y7GZXb4yGUJgMFt3cOZXgBCgKDoIIozoZ0hTbSXj5oiZckzfFKGFzfNAZpge7i7SIV7OzZYpHDZepeTLoFI1G1CnR_jtKF2IM-b4SVakU02lPAI24a_7fKZG-FbKHh9dsIhV6Tbs",
    codeUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1YzU5NjA4MThiYTUwNGVhYTc5ZWRjMmJkMDUyEgsSBxCvroWc0BUYAZIBIwoKcHJvamVjdF9pZBIVQhM2NDQwNDMzODg3MDc2MDAzNDQ3&filename=&opi=89354086",
  },
  {
    index: 5,
    id: "6b5e92985e624aa0a62765cf4642ac7b",
    name: "email_thread_dark_blue",
    title: "VxMail — Email Thread (Dark Blue)",
    imageUrl: "https://lh3.googleusercontent.com/aida/AEtjO1UALHdxebtyIprXdNRw5JpuzaCt62Acuki6i0XGV0hcMvhM1peqQ42NIQuuASnzsFMG9kFDDog8StMYjejLfh4P5JrjMNqTIhFbQGnv5aaDuUmAJ3-FW13th8-xifEnM91NGfnHGgvsg6QgZTekmerbMXfDc6crk4gr2d_8JFQ9ihTDth0T8SWTunVwbRsvIBfk5IOYYpK7z0HNP_unq2lxR1eYWKEVh8eOYfDBHJ08YAAnpjCla8xNNiA",
    codeUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1YzU5NjVkNDQxNTMwNWMyYzA4OWE3M2FjNGVhEgsSBxCvroWc0BUYAZIBIwoKcHJvamVjdF9pZBIVQhM2NDQwNDMzODg3MDc2MDAzNDQ3&filename=&opi=89354086",
  },
  {
    index: 6,
    id: "0ee0f866219441088a0730d82957140e",
    name: "inbox_dark_blue",
    title: "VxMail — Inbox (Dark Blue)",
    imageUrl: "https://lh3.googleusercontent.com/aida/AEtjO1UQdaiXDT7tyE02cadKElq1Q72iMf2DgneL9JYesBr6IJHxMWWFr5HKCnS_xE0Bbp_3AHKhKc879bRSr7J62idiGJVA98ExFhpMKrLHLMUYsu8sIEVK8sXxNvfxb9NlUe1fIArek6plWPU0u-Qu9pVFFzBM29Psjz2M5N_ZhAPgK1klUEGWoTvYicGiEmGypHoB_pmlpErdfwV0WIOD1In9zdQD2IYbYeK9BcLHECTihhwJ2j7Pf7NaKlE",
    codeUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1YzU5NjVhYjY5YmYwMjJkN2ViYWQ5MTY1ZjA3EgsSBxCvroWc0BUYAZIBIwoKcHJvamVjdF9pZBIVQhM2NDQwNDMzODg3MDc2MDAzNDQ3&filename=&opi=89354086",
  },
  {
    index: 7,
    id: "4efde3d5a1b845bb99a7d18a4ee2a012",
    name: "compose_dark_blue",
    title: "VxMail — Compose (Dark Blue)",
    imageUrl: "https://lh3.googleusercontent.com/aida/AEtjO1UE5mc-ULDoKgyGztRJDA_10IYmz95ICs_6JFiU5exoY-IwOEwLKm3M1p3FE5Co_qn3zXszJEDX7WMw0grJxoTTd7DMzXywsWsajACbr-tPiwMOUXQszi7ar6dJejKhCK6VtQM_m34CHbhi2b0kgpnOKYuw6Yc8d4tP0X0gDrIUJNCnG27OIKfnD18tGCE85HFU_plsFAj-r64W1KGp52xKxoG2EhT5K6fiKBkruxxvZ7cX2y10JV7G0pk",
    codeUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1YzU5NjU3NjkyZjIwMzkyY2JiMjdiMWNlYzQ1EgsSBxCvroWc0BUYAZIBIwoKcHJvamVjdF9pZBIVQhM2NDQwNDMzODg3MDc2MDAzNDQ3&filename=&opi=89354086",
  },
  {
    index: 8,
    id: "ecabd69f84424df9a6ab56d3b7e59f64",
    name: "search_dark_blue",
    title: "VxMail — Search (Dark Blue)",
    imageUrl: "https://lh3.googleusercontent.com/aida/AEtjO1WeX3Ci1jAnlyHAKwUJ07HfVGgly-USQju7YZzJu2VJpJJ3sEVw54oCAMhtxYmHJCWV6KRZj_tCHdjhIRymGZjY00mXXaaGw2iXaqtYWi7VJjFO7dvsoYzsfHFd4ryRveSkf80um_G6QFz0dZ3qEyc2h3KiiYJsck4M3DvZYzPJV60xYKJBf_Qqq0E1brHKVQ0ofA0XuyIvks9nTcSF-xETXlcRfYd4QIcaHLdLigxOUdQhZS2YWwkNRKU",
    codeUrl: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1YzU5NjU0NDk4MGQwMjA3YTkxNTI0MTFiODAxEgsSBxCvroWc0BUYAZIBIwoKcHJvamVjdF9pZBIVQhM2NDQwNDMzODg3MDc2MDAzNDQ3&filename=&opi=89354086",
  },
];

console.log(`[Stitch Downloader] Downloading ${screens.length} screens using curl.exe -L...`);

for (const s of screens) {
  const imgPath = path.join(targetDir, `${s.index}_${s.name}.png`);
  const codePath = path.join(targetDir, `${s.index}_${s.name}.html`);

  console.log(`\nScreen ${s.index}/${screens.length}: ${s.title} (ID: ${s.id})`);
  
  // Download image
  console.log(`  -> Downloading image to: ${path.basename(imgPath)}`);
  execSync(`curl.exe -L "${s.imageUrl}" -o "${imgPath}"`, { stdio: "inherit" });

  // Download code
  console.log(`  -> Downloading HTML code to: ${path.basename(codePath)}`);
  execSync(`curl.exe -L "${s.codeUrl}" -o "${codePath}"`, { stdio: "inherit" });
}

// Download extra logo & avatar assets
console.log("\n[Stitch Downloader] Downloading extra brand assets...");
execSync(`curl.exe -L "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1YzU5MDQzMTZhMDYwMjhmMDllOTI0MjhhYTc4EgsSBxCvroWc0BUYAZIBIwoKcHJvamVjdF9pZBIVQhM2NDQwNDMzODg3MDc2MDAzNDQ3&filename=&opi=89354086" -o "${path.join(targetDir, "vxmail_logo.svg")}"`);
execSync(`curl.exe -L "https://lh3.googleusercontent.com/aida/AEtjO1W87-NrtKTz9jUk29NvsNP3e5eoCqhI-xqmL_uiddsoMxkF1AfwGJuM1BIdMfndwPtp5S4jr4c9Y0gjIAVKJQBwsA88HBGcI5M58VLnp266_dnLyQ2P-09qp5PZEnTtmNdaQpntT6VaEppiImlQkgVaQXMgAuyBDr86JVDV3JKo5KQBUpiog9T_My6YLCFt5YV1O1G9L7LOVG2QlnWQRs7OLXlCBnwfABL01jodVGOOZO3oNORmSzyvPXU" -o "${path.join(targetDir, "avatar_portrait.png")}"`);

console.log("\n[Stitch Downloader] All 8 screens and assets successfully downloaded into stitch_screens/ !");
