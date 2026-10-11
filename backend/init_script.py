
import pandas as pd

# 1.0 Set the path to the Excel file
data = "stanfordMOOCForumPostsSet.xlsx"
dataset = pd.read_excel(data)

# Display the dataset dimensions (number of rows and columns)
print(dataset.shape)

# 1.1 Remove rows with missing values in the specified columns
data_rows_cleaned = dataset.dropna(subset=['Text', 'forum_uid', 'created_at', 'CourseType'])

# Display the first five rows and dimensions of the cleaned dataset
print('Cleaned dataset:\n', data_rows_cleaned.head(), '\n', data_rows_cleaned.shape)

# 1.2 Remove duplicate rows based on the 'Text' column
data_rows_cleaned = data_rows_cleaned.drop_duplicates(subset=['forum_uid', 'Text'], keep='first')
# Display the first five rows and dimensions of the dataset after removing duplicates
print('Dataset after removing duplicates:\n', data_rows_cleaned.head(), '\n', data_rows_cleaned.shape)