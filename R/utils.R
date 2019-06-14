#' @import stats
getPC <- function(data, clusters, num_PCs = 2) {
  # Check PVE
  data_cov <- cov(data) #Covariance matrix is a linear transformation of the original data
  data_eigen <- eigen(data_cov) #Eigen vectors and values (linear combinations)
  PVE <- data_eigen$values/sum(data_eigen$values) #Measure of variance explained (Eigenvalues represent variance magnitude in direction of covariance spread)
  idxs <- NULL
  PVEs <- PVE
  for (i in 1:num_PCs) {
    idx <- which.max(PVE) #Find max variance explained
    idxs <- c(idxs, idx) #Add index of max variance explained to get eigenvector later
    PVE[idx] <- NaN #Remove max PVE from list
  }

  # Calculate PC
  phi <- -data_eigen$vectors #Get the vectors
  suppressWarnings(rm(PCs))
  for (i in 1:nrow(phi)) {
    # The following matrix multiplication finds the linear combination "b" (PCn) of "A" (the data) when multiplied by the scalar "x" (phi[,index])
    # Essentially, when plotted, the visual is of two linear combinations of matrix "A"
    PC <- as.matrix(data) %*% phi[,i]
    if (!exists("PCs")) {
      PCs <- data.frame(PC)
    } else {
      PCs <- cbind(PCs, data.frame(PC))
    }
    colnames(PCs)[i] <- paste0("PC", i)
  }

  # Calculate variable contribution
  contribution <- matrix(nrow = nrow(data_eigen$vectors), ncol = nrow(data_eigen$vectors))
  for (i in 1:nrow(data_eigen$vectors)) {
    contribution[,i] <- (data_eigen$vectors[,i]^2*100) / sum(data_eigen$vectors[,i]^2)
  }

  # Get clusters
  clusters_data <- as.data.frame(clusters)

  # Create dataframe of the PC's
  PC <- data.frame(PCs, clusters_data)

  # Create dataframe of the PVE's
  PC_PVE <- data.frame(PVEs)
  rownames(PC_PVE) <- colnames(PCs)

  # Create dataframe of contributions
  cont <- data.frame(contribution)
  colnames(cont) <- colnames(PCs)
  rownames(cont) <- colnames(data)

  # Threshold of contributions (1/number of variables)
  thresh <- (1/nrow(cont))*100

  # Create output with PC df and the PVE's associated with the PC's
  out <- list(
    PC = PC, #The principal components to be plotted
    PVE = PC_PVE, #The associated percent variance explained (rows = columns of PC)
    idxs = idxs, #The indexes of the PC's. This is useful to show the user which cols in the original data are the biggest sources of explained variance (or our primary clusterers).
    cont = cont, #The contributions of each variable to each PC
    thresh = thresh #The threshold of a valuably contributing component
  )
  return(out)
}
