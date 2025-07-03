export const getLetterGrade = (percentage) => {
  switch (true) {
    case percentage >= 93:
      return "A";
    case percentage >= 90 && percentage < 93:
      return "A-";
    case percentage >= 87 && percentage < 90:
      return "B+";
    case percentage >= 83 && percentage < 87:
      return "B";
    case percentage >= 80 && percentage < 83:
      return "B-";
    case percentage >= 77 && percentage < 80:
      return "C+";
    case percentage >= 73 && percentage < 77:
      return "C";
    case percentage >= 70 && percentage < 73:
      return "C-";
    case percentage >= 67 && percentage < 70:
      return "D+";
    case percentage >= 63 && percentage < 67:
      return "D";
    case percentage >= 60 && percentage < 63:
      return "D-";
    case percentage < 60:
      return "F";
    default:
      return "Invalid Percentage";
  }
};

export const gradeRanges = {
  A: { min: 93, max: 100 },
  "A-": { min: 90, max: 92.99 },
  "B+": { min: 87, max: 89.99 },
  B: { min: 83, max: 86.99 },
  "B-": { min: 80, max: 82.99 },
  "C+": { min: 77, max: 79.99 },
  C: { min: 73, max: 76.99 },
  "C-": { min: 70, max: 72.99 },
  "D+": { min: 67, max: 69.99 },
  D: { min: 63, max: 66.99 },
  "D-": { min: 60, max: 62.99 },
  F: { min: 0, max: 59.99 },
};

export const allGrades = [
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D+",
  "D",
  "D-",
  "F",
];

export const calculatePercentage = (total, obtained) =>
  Math.round((obtained / total) * 100);

export const chunkArray = (array, chunkSize = 10) => {
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
};

export const getGradeColor = (total, obtained, is_complete) => {
  const percentage = calculatePercentage(total, obtained);
  if (!is_complete) return "text-black";
  else if (percentage >= 77) return "text-green";
  else if (percentage >= 60) return "text-[#FFC400]";
  else return "text-[#BF2600]";
  // switch (percentage) {
  //   case percentage >= 77:
  //     return "#006644";
  //   case percentage >= 60:
  //     return "#FFC400";
  //   case percentage < 60:
  //     return "#BF2600";
  //   default:
  //     return "black";
  // }
};

export const calculateAverageGrade = (gradedFiles) => {
  const completedFiles = gradedFiles?.filter(file => file.is_complete === 1);

  if (!completedFiles || completedFiles.length === 0) return '0%';

  const totalGrades = completedFiles.reduce((sum, file) => {
    const percentage = (file.obtained_points / file.total_points) * 100;
    return sum + percentage;
  }, 0);

  const average = totalGrades / completedFiles.length;
  return `${Math.round(average)}%`;
};



export const base64toBlob = (data) => {
  // Cut the prefix `data:application/pdf;base64` from the raw base 64
  const base64WithoutPrefix = data.substr('data:application/pdf;base64,'.length);

  const bytes = atob(base64WithoutPrefix);
  let length = bytes.length;
  let out = new Uint8Array(length);

  while (length--) {
    out[length] = bytes.charCodeAt(length);
  }

  return new Blob([out], { type: 'application/pdf' });
};