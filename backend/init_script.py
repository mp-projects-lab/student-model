import pandas as pd

data = "stanfordMOOCForumPostsSet.xlsx"
dataset = pd.read_excel(data)

print(dataset.head())