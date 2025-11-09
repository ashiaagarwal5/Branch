import math
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.decomposition import PCA
from sklearn.linear_model import LassoCV
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.metrics import mean_squared_error, r2_score

dataset = pd.read_csv("productivity_P_T_F_y_1000.csv")

#define x, y columns (independent and dependent variables)
iv = [0, 1, 2]
X, y = dataset.iloc[:, iv], dataset.iloc[:, 3] 

# split the data into train and test
X_train, X_test, y_train, y_test = train_test_split(X.values, y.values, test_size=0.25, random_state = 98)

#standardize data
scaler = StandardScaler()
X_scaled_train = scaler.fit_transform(X_train)
X_scaled_test = scaler.transform(X_test)

#one-dimensional PCA on x1 and x3
pca = PCA(n_components = 1)
X_PCA_train = pca.fit_transform(X_scaled_train[:, [0, 2]])
X_PCA_test = pca.transform(X_scaled_test[:, [0, 2]])
print(pca.explained_variance_ratio_)

#combine PCA and scaled datasets
X_PCAScaled_train = np.hstack((X_PCA_train, X_scaled_train[:, [1]]))
X_PCAScaled_test = np.hstack((X_PCA_test, X_scaled_test[:, [1]]))

#create regression/model and fit it to data
lin_model = LassoCV(alphas = np.logspace(-4, 3, 10), max_iter = 50000)
lin_model.fit(X_PCAScaled_train, y_train)

#create prediction for test data
y_pred = lin_model.predict(X_PCAScaled_test)

#calc mse
mse = mean_squared_error(y_test, y_pred)
print(f"Root Mean Squared Error: {math.sqrt(mse)}")

#calc R2
r2 = r2_score(y_test, y_pred)
print(f"R^2: {r2}")

#find intercept
print(f"Intercept: {lin_model.intercept_}")

#return optimal alpha
print(f"Optimal alpha: {lin_model.alpha_}")

#return model coefficients
coef = lin_model.coef_
feature_names = np.hstack((np.array(['PCA(productive_time, proportion_of_productivity)']), poly_model.get_feature_names_out(X.iloc[:, [1]].columns.tolist())))
print(f"Labels: {feature_names}")
print(f"Coefficients: {coef}")

terms = [f"{coef_i:+.6f}*{name}" for coef_i, name in zip(coef, feature_names)]
equation = "y = " + " ".join(terms)
print(equation)