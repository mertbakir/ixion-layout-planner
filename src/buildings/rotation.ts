export function rotate90Clockwise(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated: number[][] = [];

  for (let j = 0; j < cols; j++) {
    rotated[j] = [];
    for (let i = rows - 1; i >= 0; i--) {
      rotated[j].push(matrix[i][j]);
    }
  }

  return rotated;
}

export function rotateNTimes(matrix: number[][], times: number): number[][] {
  let result = matrix.map(row => [...row]); // Deep copy
  const normalizedTimes = times % 4;

  for (let i = 0; i < normalizedTimes; i++) {
    result = rotate90Clockwise(result);
  }

  return result;
}

export function getMatrixDimensions(matrix: number[][]): [number, number] {
  return [matrix.length, matrix[0]?.length || 0];
}
