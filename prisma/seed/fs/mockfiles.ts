import { MockFileSystem } from './MockFileSystem';

export const imagesFullDir = '/root';
export const hiddenFileName = '.hidden';
export const recursiveDir = 'nested';
export const recursiveFileName = 'nested/c.png';
export const mockEmptyDir = '/empty_dir';
export const expectedMockFilePaths = ['/root/a.jpg', '/root/b.png']; // top-level images only

const mockFs = new MockFileSystem({
  // top-level directory
  [imagesFullDir]: {
    dir: true,
    children: [
      'a.jpg',
      'b.png',
      hiddenFileName,
      'not-an-image.txt',
      recursiveDir,
    ],
  },

  // empty directory
  [mockEmptyDir]: { dir: true, children: [] },

  // files in top-level
  ['/root/a.jpg']: Buffer.from('img1'),
  ['/root/b.png']: Buffer.from('img2'),
  [`/root/${hiddenFileName}`]: Buffer.from('secret'),
  ['/root/not-an-image.txt']: Buffer.from('txt'),

  // nested directory
  ['/root/nested']: { dir: true, children: ['c.png'] },
  ['/root/nested/c.png']: Buffer.from('img3'),
});
export default mockFs;
